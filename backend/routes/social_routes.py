import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database.database import get_db
from models.portfolio import Portfolio
from models.social import DiscussionComment, Follow, PortfolioShare, StockDiscussion, UserProfile
from models.transaction import Transaction
from models.user import User
from routes.auth_utils import get_current_user
from schemas.social_schema import (
    CommentCreate,
    DiscussionCreate,
    DiscussionCommentResponse,
    DiscussionResponse,
    FollowActionResponse,
    PortfolioShareCreate,
    PortfolioShareResponse,
    SharedPortfolioResponse,
    UserProfileUpdate,
    UserPublicProfileResponse,
)

router = APIRouter(prefix="/social", tags=["social"])


def _ensure_profile(db: Session, user: User) -> UserProfile:
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    if profile:
        return profile

    profile = UserProfile(user_id=user.id)
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/profile", response_model=UserPublicProfileResponse)
def upsert_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = _ensure_profile(db, current_user)

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.website is not None:
        profile.website = payload.website
    if payload.is_public is not None:
        profile.is_public = payload.is_public

    db.commit()
    db.refresh(profile)

    return UserPublicProfileResponse(
        username=current_user.username,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        website=profile.website,
        is_public=profile.is_public,
        followers_count=profile.followers_count,
        following_count=profile.following_count,
    )


@router.get("/users/{username}", response_model=UserPublicProfileResponse)
def get_user_profile(username: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    profile = _ensure_profile(db, user)
    if not profile.is_public:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Profile is private")

    return UserPublicProfileResponse(
        username=user.username,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        website=profile.website,
        is_public=profile.is_public,
        followers_count=profile.followers_count,
        following_count=profile.following_count,
    )


@router.post("/follow/{user_id}", response_model=FollowActionResponse)
def follow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    existing = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already following this user")

    db.add(Follow(follower_id=current_user.id, following_id=user_id))

    follower_profile = _ensure_profile(db, current_user)
    target_profile = _ensure_profile(db, target_user)
    follower_profile.following_count += 1
    target_profile.followers_count += 1

    db.commit()

    return FollowActionResponse(message="Followed user", following_id=user_id)


@router.delete("/follow/{user_id}", response_model=FollowActionResponse)
def unfollow_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    follow = db.query(Follow).filter(Follow.follower_id == current_user.id, Follow.following_id == user_id).first()
    if not follow:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow relationship not found")

    target_user = db.query(User).filter(User.id == user_id).first()
    if target_user:
        follower_profile = _ensure_profile(db, current_user)
        target_profile = _ensure_profile(db, target_user)

        follower_profile.following_count = max(0, follower_profile.following_count - 1)
        target_profile.followers_count = max(0, target_profile.followers_count - 1)

    db.delete(follow)
    db.commit()

    return FollowActionResponse(message="Unfollowed user", following_id=user_id)


@router.post("/portfolio/share", response_model=PortfolioShareResponse)
def share_portfolio(
    payload: PortfolioShareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    share = PortfolioShare(
        user_id=current_user.id,
        share_key=secrets.token_urlsafe(16),
        is_public=True,
        show_transactions=payload.show_transactions,
    )
    db.add(share)
    db.commit()
    db.refresh(share)

    return share


@router.get("/portfolio/{share_key}", response_model=SharedPortfolioResponse)
def get_shared_portfolio(share_key: str, db: Session = Depends(get_db)):
    share = (
        db.query(PortfolioShare)
        .options(joinedload(PortfolioShare.user))
        .filter(PortfolioShare.share_key == share_key)
        .first()
    )
    if not share or not share.is_public:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shared portfolio not found")

    holdings = db.query(Portfolio).filter(Portfolio.user_id == share.user_id).all()
    transactions = db.query(Transaction).filter(Transaction.user_id == share.user_id).all()

    holdings_payload = [
        {
            "symbol": item.symbol,
            "quantity": item.quantity,
            "average_price": item.average_price,
        }
        for item in holdings
    ]

    transactions_payload = None
    if share.show_transactions:
        transactions_payload = [
            {
                "symbol": txn.symbol,
                "transaction_type": str(txn.transaction_type),
                "quantity": txn.quantity,
                "price_per_share": txn.price_per_share,
                "total_value": txn.total_value,
                "transaction_date": txn.transaction_date.isoformat(),
            }
            for txn in transactions
        ]

    return SharedPortfolioResponse(
        owner_username=share.user.username,
        holdings=holdings_payload,
        transactions=transactions_payload,
    )


@router.get("/stocks/{symbol}/discussions", response_model=list[DiscussionResponse])
def get_stock_discussions(symbol: str, db: Session = Depends(get_db)):
    discussions = (
        db.query(StockDiscussion)
        .options(
            joinedload(StockDiscussion.user),
            joinedload(StockDiscussion.comments).joinedload(DiscussionComment.user),
        )
        .filter(StockDiscussion.symbol == symbol.upper())
        .order_by(StockDiscussion.created_at.desc())
        .all()
    )

    return [
        DiscussionResponse(
            id=item.id,
            symbol=item.symbol,
            user_id=item.user_id,
            username=item.user.username,
            title=item.title,
            content=item.content,
            upvotes=item.upvotes,
            created_at=item.created_at,
            comments=[
                DiscussionCommentResponse(
                    id=comment.id,
                    user_id=comment.user_id,
                    username=comment.user.username,
                    content=comment.content,
                    upvotes=comment.upvotes,
                    created_at=comment.created_at,
                )
                for comment in item.comments
            ],
        )
        for item in discussions
    ]


@router.post("/stocks/{symbol}/discussions", response_model=DiscussionResponse, status_code=status.HTTP_201_CREATED)
def create_discussion(
    symbol: str,
    payload: DiscussionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    discussion = StockDiscussion(
        symbol=symbol.upper(),
        user_id=current_user.id,
        title=payload.title,
        content=payload.content,
    )
    db.add(discussion)
    db.commit()
    db.refresh(discussion)

    return DiscussionResponse(
        id=discussion.id,
        symbol=discussion.symbol,
        user_id=discussion.user_id,
        username=current_user.username,
        title=discussion.title,
        content=discussion.content,
        upvotes=discussion.upvotes,
        created_at=discussion.created_at,
        comments=[],
    )


@router.post("/discussions/{discussion_id}/comments", response_model=DiscussionCommentResponse, status_code=status.HTTP_201_CREATED)
def add_comment(
    discussion_id: int,
    payload: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    discussion = db.query(StockDiscussion).filter(StockDiscussion.id == discussion_id).first()
    if not discussion:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discussion not found")

    comment = DiscussionComment(
        discussion_id=discussion_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return DiscussionCommentResponse(
        id=comment.id,
        user_id=comment.user_id,
        username=current_user.username,
        content=comment.content,
        upvotes=comment.upvotes,
        created_at=comment.created_at,
    )
