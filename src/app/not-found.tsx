'use client';
import Link from 'next/link'
import { Button } from '@/components/ui/shadcn-ui/button'
import { XCircle } from 'lucide-react'
import { page_basic_css } from '@/lib/custom';

import { cn } from '@/lib/utils';
interface NotFoundProps {
  error?: string;
}

export default function NotFound({ error }: NotFoundProps) {
  return (


    <div className={cn(page_basic_css, "justify-center")}>

      <div className='max-w-md flex flex-col items-center justify-center gap-4'>
        <XCircle className='h-16 w-16 text-red-500 mx-auto' />
        <h2 className='text-3xl font-bold tracking-tight text-foreground'>Page Not Found</h2>
        <p className='text-lg text-foreground mt-2'>{`Sorry, we couldn't find the resource you requested`}</p>
        <p className="flex justify-center items-center text-red-500">{error}</p>
        <Button asChild className='mt-6'>
          <Link href="/">Return Home</Link>
        </Button>
      </div>

    </div>


  )
}