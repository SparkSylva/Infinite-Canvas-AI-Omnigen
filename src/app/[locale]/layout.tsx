import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "@/style/globals.css";

import TranslationsProvider from '@/components/provider/TranslationsProvider';
import i18nConfig from '@/lib/i18n/i18nConfig';
import initTranslations from '@/lib/i18n/i18n';
import AnalyzeProvider from '@/components/provider/AnalyzeProvider';

import { notFound } from 'next/navigation';

const fraunces = Fraunces({
  variable: "--font-fraunces",
  style: ['normal', 'italic'],
  subsets: ["latin"],
});

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return i18nConfig.locales.map(locale => ({ locale }));
}
const i18nNamespaces = [ 'pageInfo', 'components', 'app/generator'];

export default async function PageLayout(props: Props) {
  const params = await props.params;

  const {
    locale
  } = params;

  const {
    children
  } = props;
  if (!i18nConfig.locales.includes(locale)) {
    notFound();
  }
  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  return (
    <div>
      <AnalyzeProvider />
      <div
        className={`antialiased ${fraunces.className}`}
      >
        <TranslationsProvider
          namespaces={i18nNamespaces}
          locale={locale}
          resources={resources}>

          {children}

        </TranslationsProvider>
      </div>
    </div>
  );
}
