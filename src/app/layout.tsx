import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "@/style/globals.css";

import i18nConfig from '@/lib/i18n/i18nConfig';


type Props = {
  children: React.ReactNode;
};



export default async function RootLayout(props: Props) {
  const {
      children
  } = props;
  return (
    <html>
      <body>
        {children}
      </body>
    </html>
  );
}