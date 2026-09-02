function FoundItems() {
  const items = [
    {
      name: 'Black Backpack',
      location: 'Computer Lab',
      date: 'Aug 6, 2026',
      category: 'Bag',
    },
    {
      name: 'Student ID Card',
      location: 'Canteen',
      date: 'Aug 5, 2026',
      category: 'Personal',
    },
    {
      name: 'Wireless Earphones',
      location: 'Auditorium Hall',
      date: 'Aug 4, 2026',
      category: 'Electronics',
    },
  ]

  return (
    <section className="bg-white py-16 px-6">
      <div className="max-w-6xl mx-auto">

        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-green-600 font-semibold mb-2">
              RECENT FINDS
            </p>

            <h2 className="text-3xl font-bold text-slate-900">
              Recently Found Items
            </h2>

            <p className="text-slate-500 mt-2">
              Check items that have been found by other students.
            </p>
          </div>

          <button className="hidden sm:block text-green-600 font-semibold hover:text-green-800">
            View All
          </button>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {items.map((item) => (
            <div
              key={item.name}
              className="bg-slate-50 rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
            >

              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center mb-5">
                <span className="text-2xl">
                  ✓
                </span>
              </div>


              <div className="flex items-center justify-between mb-3">

                <span className="text-xs font-semibold bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  FOUND
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


              <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg">
                Claim Item
              </button>


            </div>
          ))}

        </div>

      </div>
    </section>
  )
}

export default FoundItems