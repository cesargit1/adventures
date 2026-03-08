export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="max-w-4xl">
          <p className="text-base/7 font-semibold text-black">About us</p>
          <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            On a mission to help people find their next adventure
          </h1>
          <p className="mt-6 text-balance text-xl/8 text-gray-700">
            AdventuresCalendar exists to make outdoor experiences easier to discover, easier to join,
            and easier to share with others who love getting outside.
          </p>
        </div>
        <section className="mt-20 grid grid-cols-1 lg:grid-cols-2 lg:gap-x-8 lg:gap-y-16">
          <div className="lg:pr-8">
            <h2 className="text-pretty text-2xl font-semibold tracking-tight text-gray-900">Our mission</h2>
            <p className="mt-6 text-base/7 text-gray-600">
              We built AdventuresCalendar to bring adventure seekers, trip hosts, and local outdoor
              communities together in one place. Whether someone is looking for a weekend camping trip,
              a scenic hike, an off-road meetup, or a new group to explore with, the goal is to make
              that discovery feel simple and approachable.
            </p>
            <p className="mt-8 text-base/7 text-gray-600">
              Our focus is on clarity, trust, and connection. We want hosts to have a better way to
              share experiences, and participants to feel confident browsing maps, calendars, and lists
              to find adventures that fit their schedule, interests, and comfort level.
            </p>
          </div>
          <div className="pt-16 lg:row-span-2 lg:-mr-16 xl:mr-auto">
            <div className="-mx-8 grid grid-cols-2 gap-4 sm:-mx-16 sm:grid-cols-4 lg:mx-0 lg:grid-cols-2 xl:gap-8">
              <div className="aspect-square overflow-hidden rounded-xl shadow-xl outline outline-1 -outline-offset-1 outline-black/10">
                <img
                  alt="Campers gathered outdoors"
                  src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&crop=center&w=560&h=560&q=90"
                  className="block size-full object-cover"
                />
              </div>
              <div className="-mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline outline-1 -outline-offset-1 outline-black/10 lg:-mt-40">
                <img
                  alt="Friends hiking together"
                  src="https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&crop=center&w=560&h=560&q=90"
                  className="block size-full object-cover"
                />
              </div>
              <div className="aspect-square overflow-hidden rounded-xl shadow-xl outline outline-1 -outline-offset-1 outline-black/10">
                <img
                  alt="Mountain lake adventure"
                  src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&crop=center&w=560&h=560&q=90"
                  className="block size-full object-cover"
                />
              </div>
              <div className="-mt-8 aspect-square overflow-hidden rounded-xl shadow-xl outline outline-1 -outline-offset-1 outline-black/10 lg:-mt-40">
                <img
                  alt="Off-road desert trail"
                  src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&crop=center&w=560&h=560&q=90"
                  className="block size-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="max-lg:mt-16 lg:col-span-1">
            <p className="text-base/7 font-semibold text-gray-500">What drives us</p>
            <hr className="mt-6 border-t border-gray-200" />
            <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4">
                <dt className="text-sm/6 text-gray-600">Mission</dt>
                <dd className="order-first text-6xl font-semibold tracking-tight text-gray-900">
                  <span>1</span>
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 border-b border-dotted border-gray-200 pb-4">
                <dt className="text-sm/6 text-gray-600">Ways to explore</dt>
                <dd className="order-first text-6xl font-semibold tracking-tight text-gray-900">
                  <span>3</span>
                </dd>
              </div>
              <div className="flex flex-col gap-y-2 max-sm:border-b max-sm:border-dotted max-sm:border-gray-200 max-sm:pb-4">
                <dt className="text-sm/6 text-gray-600">Seasons of adventure</dt>
                <dd className="order-first text-6xl font-semibold tracking-tight text-gray-900">
                  <span>4</span>
                </dd>
              </div>
              <div className="flex flex-col gap-y-2">
                <dt className="text-sm/6 text-gray-600">Community mindset</dt>
                <dd className="order-first text-6xl font-semibold tracking-tight text-gray-900">
                  <span>∞</span>
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>
    </div>
  )
}
