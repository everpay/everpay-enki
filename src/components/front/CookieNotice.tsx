import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { X } from "lucide-react"

export function CookieNotice() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem("everpay-cookie-consent")
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 800)
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
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center p-0 sm:p-6">
        <div
          className="w-full sm:max-w-[640px] bg-white sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-2">
            <h2
              className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight"
              style={{ fontFamily: "Manrope, sans-serif" }}
            >
              Everpay gives you choice
            </h2>
            <button
              onClick={dismiss}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -mr-1 -mt-1"
              aria-label="Dismiss cookie notice"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-6 pb-2">
            <p
              className="text-[15px] text-gray-600 leading-relaxed mb-4"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              We use cookies to collect data insights, personalize your web experience, support our web
              functionality, help us understand how our websites and applications are used, and provide you
              with tailored ads. Those include "necessary cookies" that are essential to ensuring optimal
              performance of our websites and applications, and other types of cookies such as functionality
              cookies and advertising cookies.
            </p>
            <p
              className="text-[15px] text-gray-600 leading-relaxed"
              style={{ fontFamily: "Inter, sans-serif" }}
            >
              Necessary cookies are always required as they are essential to ensure optimal performance of
              our websites and applications. You may consent to other cookies which allow Everpay to provide
              you with a consistent, customized, and personalized experience, based on your preferences and
              interests. To learn more about our cookies and privacy practices, please visit our{" "}
              <Link
                to="/privacy-policy"
                className="text-[#1aa478] hover:underline font-medium"
              >
                privacy notice.
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 space-y-3">
            <Button
              onClick={accept}
              className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-full h-12 text-base font-semibold shadow-none"
            >
              Accept All Cookies
            </Button>
            <Button
              variant="outline"
              onClick={dismiss}
              className="w-full border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 rounded-full h-12 text-base font-semibold shadow-none"
            >
              Custom Settings
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
