import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { X } from "lucide-react"

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem("everpay-cookie-consent")
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = () => {
    localStorage.setItem("everpay-cookie-consent", "accepted")
    setVisible(false)
  }

  const dismiss = () => {
    localStorage.setItem("everpay-cookie-consent", "dismissed")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-[60] p-4 md:p-6 pointer-events-none">
      <div
        className="pointer-events-auto max-w-[520px] ml-auto md:ml-0 w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-6 animate-in slide-in-from-bottom-4 duration-500"
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p
              className="text-sm font-semibold text-gray-900 mb-1"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              We use cookies
            </p>
            <p
              className="text-sm text-gray-500 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              We use cookies to improve your experience, analyze traffic, and personalize content. By
              continuing to use this site, you agree to our use of cookies.{" "}
              <Link to="/cookie-policy"
                className="text-[#1aa478] hover:underline font-medium"
              >
                Learn more
              </Link>
            </p>
            <div className="flex items-center gap-3 mt-4">
              <Button
                size="sm"
                onClick={accept}
                className="bg-[#1aa478] hover:bg-[#158f68] text-white rounded-full px-5 h-9 text-sm font-semibold shadow-none"
              >
                Accept all
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={dismiss}
                className="border-gray-200 bg-transparent text-gray-600 hover:bg-gray-50 rounded-full px-5 h-9 text-sm font-semibold shadow-none"
              >
                Reject non-essential
              </Button>
            </div>
          </div>
          <button
            onClick={dismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1"
            aria-label="Dismiss cookie notice"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
