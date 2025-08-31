'use client'
import React, { useState } from 'react';
// import Link from 'next/link';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/shadcn-ui/select';
import { Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from "@/components/ui/shadcn-ui/button";
import { useTranslation } from 'react-i18next';
import i18nConfig, { languageNames } from '@/lib/i18n/i18nConfig';
import { ChangeEvent } from 'react';

// Define the interface for component props
interface LanguageSelectorProps {
    languages?: Array<{
        lang: string;
        language: string;
    }>;
    selectedLanguage?: string;
    currentPath?: string;
}

// Define default languages and selected language
const defaultLanguages = [
    { lang: 'en', language: 'English' },
    { lang: 'es', language: 'Español' },
    { lang: 'fr', language: 'Français' },
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({

}) => {
    const { i18n } = useTranslation();
    const currentLocale = i18n.language;
    const router = useRouter();
    const currentPathname = usePathname();

    const asPath = currentLocale === i18nConfig.defaultLocale ?
        currentPathname : currentPathname.replace(`/${currentLocale}`, ``);
    const languages = i18nConfig.locales.map(lang => ({
        lang,
        language: languageNames[lang as keyof typeof languageNames] || lang// here you may want to convert the language code to the full language name
    }));

    const handleChange = (newLocale: any) => {
        // const newLocale = e.target.value;

        // set cookie for next-i18n-router e: ChangeEvent<HTMLSelectElement>
        const days = 30;
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `NEXT_LOCALE=${newLocale};expires=${date.toUTCString()};path=/`;

        // redirect to the new locale path
        if (
            currentLocale === i18nConfig.defaultLocale &&
            !i18nConfig.prefixDefault
        ) {
            router.push('/' + newLocale + currentPathname);
        } else {
            router.push(
                currentPathname.replace(`/${currentLocale}`, `/${newLocale}`)
            );
        }

        router.refresh();
    };

    return (
        <Select onValueChange={handleChange}>
            <SelectTrigger className="w-auto w-max-[280px] "
            >
                <Globe className="w-5 h-5 mr-2 " />
                <SelectValue placeholder={currentLocale} />
                {/* <span>{currentLocale}</span> */}
                {/* {selectedLang == 'en' ? 'EN' : selectedLang?.toUpperCase()} */}
                {/* <ChevronDownIcon className="-mr-1 h-5 w-5 text-black" aria-hidden="true" /> */}

            </SelectTrigger>
            <SelectContent >
                {languages.map(({ lang, language }) => (

                    <a key={lang} href={`/${lang}${asPath}`} 
                        className="block w-full px-4 py-2 text-sm hover:bg-accent/40" >
                        {language}

                    </a>
                    // <span key={lang} onClick={()=>handleChange(lang)}
                    //     className="block px-4 py-2 text-sm hover:bg-accent" >
                    //     {language}
                    // </span>
                    // <SelectItem value={lang}>{lang}</SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
};

export default LanguageSelector;
