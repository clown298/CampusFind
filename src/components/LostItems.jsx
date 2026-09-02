function LostItems() {
  const items = [
    {
      name: 'Black Wallet',
      location: 'Library',
      date: 'Aug 5, 2026',
      category: 'Personal',
    },
    {
      name: 'Blue Water Bottle',
      location: 'Sports Ground',
      date: 'Aug 4, 2026',
      category: 'Accessories',
    },
    {
      name: 'Scientific Calculator',
      location: 'Classroom 08',
      date: 'Aug 3, 2026',
      category: 'Study',
    },
  ]

  return (
    <section className="bg-slate-50 py-16 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-blue-600 font-semibold mb-2">
              RECENT REPORTS
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Recently Lost Items
            </h2>

            <p className="text-slate-500 mt-2">
              Help your fellow students find their missing belongings.
            </p>
          </div>

          <button className="hidden sm:block text-blue-600 font-semibold hover:text-blue-800">
            View All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.name}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-5">
                <span className="text-2xl">🔍</span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-3 py-1 rounded-full">
                  LOST
                </span>

                <span className="text-xs text-slate-400">
                  {item.category}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                {item.name}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-slate-500">
                <p>
                  📍 {item.location}
                </p>

                <p>
                  📅 {item.date}
                </p>
              </div>

              <button className="w-full mt-6 border border-slate-300 hover:bg-slate-50 text-slate-900 font-semibold py-2.5 rounded-lg">
                View Details
              </button>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

export default LostItems