export function StatsSection() {
  const stats = [
    { value: "99.99%", label: "Uptime guarantee" },
    { value: "135+", label: "Currencies supported" },
    { value: "1K+", label: "Active merchants" },
    { value: "<200ms", label: "Average response time" },
  ]

  return (
    <section className="py-16 bg-white border-y border-gray-100">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1"
                style={{ fontFamily: "Manrope, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-gray-500" style={{ fontFamily: "Inter, sans-serif" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
