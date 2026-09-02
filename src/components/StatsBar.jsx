function StatsBar() {
  return (
    <section className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">

          <div>
            <p className="text-3xl font-bold text-slate-900">
              500+
            </p>
            <p className="text-slate-500 mt-1">
              Items Reported
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-slate-900">
              320+
            </p>
            <p className="text-slate-500 mt-1">
              Items Found
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold text-slate-900">
              180+
            </p>
            <p className="text-slate-500 mt-1">
              Items Reunited
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}

export default StatsBar