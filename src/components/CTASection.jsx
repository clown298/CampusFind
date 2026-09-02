function CTASection() {
  return (
    <section className="bg-slate-900 py-16 px-6">
      <div className="max-w-5xl mx-auto text-center">

        <h2 className="text-4xl font-bold text-white mb-4">
          Lost something on campus?
        </h2>

        <p className="text-slate-300 text-lg mb-8 max-w-2xl mx-auto">
          Report your lost item or help someone by submitting a found item.
          Together we can make campus belongings easier to recover.
        </p>


        <div className="flex flex-col sm:flex-row gap-4 justify-center">

          <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg">
            Report Lost Item
          </button>


          <button className="bg-white hover:bg-slate-100 text-slate-900 font-semibold px-8 py-3 rounded-lg">
            Submit Found Item
          </button>

        </div>


      </div>
    </section>
  )
}

export default CTASection