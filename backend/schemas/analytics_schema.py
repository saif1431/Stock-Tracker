from pydantic import BaseModel


class PortfolioMetricResponse(BaseModel):
    invested_capital: float
    current_value: float
    total_return_pct: float
    annualized_return_pct: float
    max_drawdown_pct: float
    sharpe_ratio: float
    benchmark_return_pct: float | None = None
