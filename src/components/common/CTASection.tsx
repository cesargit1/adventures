export function CTASection() {
  return (
    <div>
      <div className="px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Ready to become an adventurer?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-600">
            Create your profile, discover upcoming adventures, and join a community of outdoor explorers.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/login"
              className="rounded-md bg-black px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              Get Started
            </a>
            <a href="#" className="text-sm/6 font-semibold text-gray-900">
              Learn More <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
