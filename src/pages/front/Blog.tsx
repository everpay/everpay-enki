import { SiteHeader } from "@/components/front/SiteHeader"
import { SiteFooter } from "@/components/front/SiteFooter"

import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

const featuredPosts = [
  {
    title: "The Future of Digital Payments in Asia",
    excerpt: "Exploring the latest trends and innovations shaping the payment landscape in Asia...",
    category: "Industry Insights",
    date: "Oct 15, 2023",
    image: "https://images.unsplash.com/photo-1534469589579-86bd01bc003a?auto=format&fit=crop&q=80",
  },
  {
    title: "Implementing Strong Customer Authentication",
    excerpt: "A comprehensive guide to SCA implementation for European merchants...",
    category: "Technical",
    date: "Oct 12, 2023",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80",
  },
  {
    title: "Maximizing Revenue with Smart Payment Routing",
    excerpt: "Learn how intelligent payment routing can improve authorization rates...",
    category: "Best Practices",
    date: "Oct 10, 2023",
    image: "https://images.unsplash.com/photo-1554774853-719586f82d77?auto=format&fit=crop&q=80",
  },
]

const categories = ["All", "Industry Insights", "Technical", "Best Practices", "Company News", "Case Studies"]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-white via-green-50 to-white py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1
                className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in-up"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                everpay Blog
              </h1>
              <p
                className="text-lg md:text-xl text-gray-600 animate-fade-in-up animation-delay-200"
                style={{ fontFamily: "Inter, sans-serif" }}
              >
                Insights, updates, and expert perspectives on payments and fintech.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <h2
              className="text-3xl md:text-4xl font-bold mb-12 animate-fade-in-up"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Featured Articles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <Link
                  key={index}
                  to="#"
                  className={`group animate-fade-in-up`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <article className="space-y-4">
                    <div className="relative h-60 overflow-hidden rounded-2xl">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt={post.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </div>
                    <div className="space-y-2">
                      <div
                        className="flex items-center gap-4 text-sm text-gray-600"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        <span>{post.category}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                      </div>
                      <h3
                        className="text-xl font-semibold group-hover:text-[#1aa478] transition-colors"
                        style={{ fontFamily: "Manrope, sans-serif" }}
                      >
                        {post.title}
                      </h3>
                      <p className="text-gray-600" style={{ fontFamily: "Inter, sans-serif" }}>
                        {post.excerpt}
                      </p>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2
              className="text-3xl md:text-4xl font-bold mb-6 animate-fade-in-up"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Stay Updated
            </h2>
            <p
              className="text-gray-600 mb-8 text-lg animate-fade-in-up animation-delay-200"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Subscribe to our newsletter for the latest insights and updates in the payments industry.
            </p>
            <form className="flex gap-4 animate-fade-in-up animation-delay-400">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-6 py-3 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1aa478] focus:border-transparent"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
              <Button className="bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-lg px-8">
                Subscribe
              </Button>
            </form>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
