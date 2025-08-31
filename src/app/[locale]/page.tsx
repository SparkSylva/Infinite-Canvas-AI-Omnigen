import type { Metadata, ResolvingMetadata } from 'next'

import i18nConfig, { languageAltertive } from '@/lib/i18n/i18nConfig';
import initTranslations from '@/lib/i18n/i18n';


import { cn } from '@/lib/utils';
import { page_basic_css } from '@/lib/custom';



import BaseCanva from '@/components/canvas/BaseCanva';
import { RecentGeneration_tmp } from '@/components/application/recent-generation';
import UserGuideBanner from '@/components/ui/UserGuideBanner';


type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}


const pageName = 'indexPage'
const i18nNamespaces = ['pageInfo', 'components'];
export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const params = await props.params;

  const {
    locale
  } = params;

  // read route params
  const { t, resources } = await initTranslations(locale, i18nNamespaces);

  const metaTitle = t(`${i18nNamespaces[0]}:${pageName}.meta.metaTitle`) || process.env.NEXT_PUBLIC_SITE_NAME
  const metaDescription = t(`${i18nNamespaces[0]}:${pageName}.meta.metaDescription`) || process.env.NEXT_PUBLIC_SITE_NAME

  return {
    title: metaTitle,
    description: metaDescription,
    metadataBase: new URL(`${process.env.NEXT_PUBLIC_SITE_URL}`),
    alternates: {
      canonical: locale == 'en' ? '/' : locale,
      languages: languageAltertive,
    },
    // openGraph: {
    //   title: metaTitle,
    //   images: ['/assets/other/og.webp',],
    //   url: process.env.NEXT_PUBLIC_SITE_URL
    // },
    // twitter: {
    //   card: "summary_large_image",
    //   title: metaTitle,
    //   description: metaDescription,
    //   site: process.env.NEXT_PUBLIC_SITE_URL
    // }
  }
}

export default async function Home(props: Props) {
  const params = await props.params;

  const {
    locale
  } = params;

  // i18n

  return (
    <>
      <div className="min-h-screen flex mx-auto flex-col px-2 py-8">
        {/* User Guide Banner */}
        <div className="mb-4">
          <UserGuideBanner />
        </div>

        {/* Canvas container - takes most of the available space */}
        <div className="">
          <BaseCanva
    
            containerHeight="calc(100vh - 50px)"
          />
        </div>


        <RecentGeneration_tmp />

      </div>
    </>

  );
}

