import Link from 'next/link';
import CodeGlitchCatcher from '@/components/code-glitch-catcher';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 text-center">
      <h1 className="text-6xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl text-red-500 drop-shadow-lg">
        404
      </h1>
      <p className="mt-4 text-xl sm:text-2xl font-medium text-gray-300">
        Oops! It seems you've found a broken link in the code.
      </p>
      <p className="mt-2 text-lg text-gray-400">
        While we fix it, why not play a quick game?
      </p>

      <div className="mt-8 w-full max-w-md">
        <CodeGlitchCatcher />
      </div>

      <Link href="/" className="mt-12 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
        Go to Home
      </Link>
    </div>
  );
}
