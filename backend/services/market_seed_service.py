from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from models.fundamental import Fundamental
from models.news import News
from models.sector import SectorPerformance, MarketIndex
from models.economic_data import EconomicIndicator, Commodity, CurrencyRate


def seed_market_data_if_empty(db: Session) -> None:
    """Populate core market tables with starter data when running on an empty DB."""
    if db.query(Fundamental).count() == 0:
        fundamentals = [
            Fundamental(
                symbol="AAPL",
                company_name="Apple Inc.",
                sector="Technology",
                industry="Consumer Electronics",
                market_cap=2850000000000,
                pe_ratio=29.4,
                eps=6.43,
                dividend_yield=0.52,
                dividend_per_share=0.98,
                revenue=383000000000,
                profit_margin=25.3,
                debt_to_equity=1.73,
                roa=22.5,
                roe=147.8,
                fifty_two_week_high=199.62,
                fifty_two_week_low=164.08,
                book_value=4.62,
                description="Designs and sells consumer electronics, software, and services.",
                website="https://www.apple.com",
                ceo="Tim Cook",
                employees=161000,
            ),
            Fundamental(
                symbol="MSFT",
                company_name="Microsoft Corporation",
                sector="Technology",
                industry="Software Infrastructure",
                market_cap=3120000000000,
                pe_ratio=35.8,
                eps=11.89,
                dividend_yield=0.72,
                dividend_per_share=3.0,
                revenue=245000000000,
                profit_margin=36.2,
                debt_to_equity=0.39,
                roa=17.8,
                roe=38.4,
                fifty_two_week_high=468.35,
                fifty_two_week_low=309.45,
                book_value=36.9,
                description="Cloud, AI, software, and enterprise productivity platform provider.",
                website="https://www.microsoft.com",
                ceo="Satya Nadella",
                employees=221000,
            ),
            Fundamental(
                symbol="NVDA",
                company_name="NVIDIA Corporation",
                sector="Technology",
                industry="Semiconductors",
                market_cap=2280000000000,
                pe_ratio=63.1,
                eps=2.94,
                dividend_yield=0.03,
                dividend_per_share=0.04,
                revenue=130000000000,
                profit_margin=48.1,
                debt_to_equity=0.2,
                roa=34.7,
                roe=69.3,
                fifty_two_week_high=153.13,
                fifty_two_week_low=62.5,
                book_value=3.1,
                description="Accelerated computing, AI infrastructure, and graphics processors.",
                website="https://www.nvidia.com",
                ceo="Jensen Huang",
                employees=29600,
            ),
        ]
        db.add_all(fundamentals)

    if db.query(News).count() == 0:
        now = datetime.utcnow()
        news_rows = [
            News(
                symbol="AAPL",
                title="Apple expands on-device AI features across ecosystem",
                summary="New updates focus on privacy-preserving AI workloads for consumer devices.",
                source="Reuters",
                source_url="https://www.reuters.com/",
                image_url=None,
                published_date=now - timedelta(hours=5),
                sentiment="positive",
                relevance_score=0.91,
            ),
            News(
                symbol="MSFT",
                title="Microsoft reports continued enterprise cloud demand",
                summary="Analysts note stronger-than-expected Azure enterprise deal momentum.",
                source="Bloomberg",
                source_url="https://www.bloomberg.com/",
                image_url=None,
                published_date=now - timedelta(hours=9),
                sentiment="positive",
                relevance_score=0.88,
            ),
            News(
                symbol=None,
                title="US markets open mixed as investors assess inflation outlook",
                summary="Treasury yields and commodity prices remain key drivers this week.",
                source="Financial Times",
                source_url="https://www.ft.com/",
                image_url=None,
                published_date=now - timedelta(hours=3),
                sentiment="neutral",
                relevance_score=0.84,
            ),
            News(
                symbol=None,
                title="Energy and industrial sectors lead broad market gains",
                summary="Sector breadth improves as cyclical names outperform in late session.",
                source="MarketWatch",
                source_url="https://www.marketwatch.com/",
                image_url=None,
                published_date=now - timedelta(hours=1),
                sentiment="positive",
                relevance_score=0.79,
            ),
        ]
        db.add_all(news_rows)

    if db.query(SectorPerformance).count() == 0:
        sectors = [
            SectorPerformance(sector="Technology", day_change_percent=1.24, week_change_percent=3.1, month_change_percent=6.3, three_month_change_percent=14.2, year_change_percent=28.5, stocks_count=71),
            SectorPerformance(sector="Healthcare", day_change_percent=0.37, week_change_percent=1.2, month_change_percent=2.0, three_month_change_percent=5.9, year_change_percent=11.4, stocks_count=64),
            SectorPerformance(sector="Financials", day_change_percent=-0.21, week_change_percent=0.8, month_change_percent=1.5, three_month_change_percent=4.1, year_change_percent=9.8, stocks_count=66),
            SectorPerformance(sector="Energy", day_change_percent=0.94, week_change_percent=2.4, month_change_percent=4.8, three_month_change_percent=7.6, year_change_percent=16.9, stocks_count=23),
        ]
        db.add_all(sectors)

    if db.query(MarketIndex).count() == 0:
        indices = [
            MarketIndex(symbol="SPX", name="S&P 500", current_value=5235.42, day_change=18.74, day_change_percent=0.36, year_high=5321.85, year_low=4103.78),
            MarketIndex(symbol="IXIC", name="Nasdaq Composite", current_value=16542.17, day_change=86.35, day_change_percent=0.52, year_high=16917.19, year_low=12645.23),
            MarketIndex(symbol="DJI", name="Dow Jones", current_value=39484.21, day_change=-42.66, day_change_percent=-0.11, year_high=40215.73, year_low=32327.2),
        ]
        db.add_all(indices)

    if db.query(EconomicIndicator).count() == 0:
        release_date = datetime.utcnow() - timedelta(days=7)
        indicators = [
            EconomicIndicator(indicator="Unemployment Rate", country="USA", current_value=3.9, previous_value=3.8, forecast_value=3.9, unit="%", release_date=release_date),
            EconomicIndicator(indicator="CPI YoY", country="USA", current_value=3.2, previous_value=3.1, forecast_value=3.2, unit="%", release_date=release_date),
            EconomicIndicator(indicator="GDP Growth QoQ", country="USA", current_value=2.1, previous_value=1.9, forecast_value=2.0, unit="%", release_date=release_date),
        ]
        db.add_all(indicators)

    if db.query(Commodity).count() == 0:
        commodities = [
            Commodity(symbol="XAUUSD", name="Gold", current_price=2324.5, day_change_percent=0.62, week_change_percent=1.8, month_change_percent=4.2, year_change_percent=12.3, unit="USD/oz"),
            Commodity(symbol="WTI", name="Crude Oil", current_price=81.4, day_change_percent=-0.48, week_change_percent=0.9, month_change_percent=3.6, year_change_percent=8.5, unit="USD/bbl"),
            Commodity(symbol="XAGUSD", name="Silver", current_price=27.1, day_change_percent=0.44, week_change_percent=1.1, month_change_percent=2.8, year_change_percent=10.4, unit="USD/oz"),
        ]
        db.add_all(commodities)

    if db.query(CurrencyRate).count() == 0:
        currency_rates = [
            CurrencyRate(pair="EURUSD", rate=1.0825, day_change_percent=0.12),
            CurrencyRate(pair="USDJPY", rate=151.33, day_change_percent=-0.21),
            CurrencyRate(pair="GBPUSD", rate=1.2668, day_change_percent=0.08),
        ]
        db.add_all(currency_rates)

    db.commit()
