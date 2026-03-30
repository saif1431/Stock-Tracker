import React, { useEffect, useState } from "react"
import { newsService, News } from "@/services/newsService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExternalLink } from "lucide-react"
import { useToast } from "@/components/ui/Toast"

interface NewsFeedProps {
  symbol?: string
  marketNews?: boolean
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ symbol, marketNews = false }) => {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    const fetchNews = async () => {
      setLoading(true)
      try {
        const data = marketNews
          ? await newsService.getMarketNews(10, 7)
          : symbol
            ? await newsService.getStockNews(symbol, 10, 7)
            : await newsService.getTrendingNews(10)
        setNews(data)
      } catch (error) {
        showToast("Failed to load news", "error")
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [symbol, marketNews, showToast])

  if (loading) return <div className="text-center p-6 text-sm text-muted-foreground">Loading news...</div>

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl">
          {marketNews ? "Market News" : "Latest News"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {news.length === 0 ? (
            <p className="text-muted-foreground text-sm">No news available right now</p>
          ) : (
            news.map((article) => (
              <div key={article.id} className="border-b border-border pb-4 last:border-b-0">
                <div className="flex items-start gap-3">
                  {article.image_url && (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {article.source} •{" "}
                      {new Date(article.published_date).toLocaleDateString()}
                    </p>
                    {article.sentiment && (
                      <div className="flex items-center gap-1 mt-2">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            article.sentiment === "positive"
                              ? "bg-green-500/10 text-green-700"
                              : article.sentiment === "negative"
                                ? "bg-red-500/10 text-red-700"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {article.sentiment.charAt(0).toUpperCase() +
                            article.sentiment.slice(1)}
                        </span>
                      </div>
                    )}
                  </div>
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <ExternalLink size={18} />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
