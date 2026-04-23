"use client";

import { Show, SignInButton, UserButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200 bg-white px-6 py-3 flex justify-between items-center">
      <span className="font-bold text-gray-900">Idea Validator</span>
      <div>
        <Show when="signed-out">
          <SignInButton mode="modal">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Sign in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </div>
    </nav>
  );
}