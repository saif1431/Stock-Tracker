from datetime import datetime

from pydantic import BaseModel, Field, ConfigDict


class UserProfileUpdate(BaseModel):
    bio: str | None = Field(default=None, max_length=500)
    avatar_url: str | None = Field(default=None, max_length=300)
    website: str | None = Field(default=None, max_length=300)
    is_public: bool | None = None


class UserPublicProfileResponse(BaseModel):
    username: str
    bio: str | None = None
    avatar_url: str | None = None
    website: str | None = None
    is_public: bool
    followers_count: int
    following_count: int


class FollowActionResponse(BaseModel):
    message: str
    following_id: int


class PortfolioShareCreate(BaseModel):
    show_transactions: bool = False


class PortfolioShareResponse(BaseModel):
    share_key: str
    is_public: bool
    show_transactions: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SharedPortfolioResponse(BaseModel):
    owner_username: str
    holdings: list[dict]
    transactions: list[dict] | None = None


class DiscussionCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1, max_length=3000)


class CommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=1000)


class DiscussionCommentResponse(BaseModel):
    id: int
    user_id: int
    username: str
    content: str
    upvotes: int
    created_at: datetime


class DiscussionResponse(BaseModel):
    id: int
    symbol: str
    user_id: int
    username: str
    title: str
    content: str
    upvotes: int
    created_at: datetime
    comments: list[DiscussionCommentResponse]
