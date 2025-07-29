import "./globals.css";
import  Provider  from '../contexts/Web3AuthContext';
import { cookieToWeb3AuthState } from "@web3auth/modal";

import { Inter } from "next/font/google";
import { headers } from "next/headers";
const inter = Inter({ subsets: ["latin"] });



export const metadata = {
  title: "Alpha Options",
  description: "27 Stocks, Forex and Crypto Options",
};
// eslint-disable-next-line no-undef
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const web3authInitialState = cookieToWeb3AuthState(headersList.get('cookie'));
  return (
    <html lang="en">
      <body className={inter.className}>
        <Provider web3authInitialState={web3authInitialState}>{children}</Provider>
      </body>
    </html>
  );
}