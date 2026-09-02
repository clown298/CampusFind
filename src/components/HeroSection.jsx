function HeroSection() {
  return (
    <section className="min-h-[500px] bg-slate-900 flex items-center justify-center px-6">
      <div className="text-center max-w-3xl">

        <p className="text-blue-400 font-semibold mb-4">
          CAMPUS LOST & FOUND
        </p>

        <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
          Lost something?
          <br />
          We can help you find it.
        </h2>

        <p className="text-slate-300 text-lg mb-8">
          Report lost items, discover found items, and help reunite
          belongings with their owners on campus.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg">
            Report Lost Item
          </button>

          <button className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-6 py-3 rounded-lg">
            Browse Found Items
          </button>

        </div>

      </div>
    </section>
  )
}

export default HeroSection