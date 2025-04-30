export default function ShopPage() {
  return (
    <main className="flex flex-col items-center justify-center grow bg-[#F7FAFC] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl font-bold text-[#0A3357] mb-6">Shop Coming Soon</h1>
        <p className="text-xl text-[#1A202C] mb-8">
          We&apos;re working on bringing you high-quality walking golf gear and accessories.
          Check back soon!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
            <div className="text-3xl mb-4">👕</div>
            <h3 className="text-lg font-semibold text-[#0A3357] mb-2">Apparel</h3>
            <p className="text-[#1A202C]">
              Premium golf clothing designed for walking comfort
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
            <div className="text-3xl mb-4">🛄</div>
            <h3 className="text-lg font-semibold text-[#0A3357] mb-2">Push Carts</h3>
            <p className="text-[#1A202C]">
              Top-rated push carts and accessories
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-300">
            <div className="text-3xl mb-4">⛳</div>
            <h3 className="text-lg font-semibold text-[#0A3357] mb-2">Accessories</h3>
            <p className="text-[#1A202C]">
              Essential gear for the walking golfer
            </p>
          </div>
        </div>
      </div>
    </main>
  )
} 