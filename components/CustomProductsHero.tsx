'use client';
import Image from 'next/image';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

export default function CustomProductsHero() {
    return (
        <div className="w-full bg-surface text-foreground border-b border-border">
            <div className={PAGE_CONTAINER_CLASS}>

                <div className="grid grid-cols-1 lg:grid-cols-2 items-center overflow-hidden">

                    <div className="py-6 sm:py-8 lg:py-12 pr-0 lg:pr-8 z-10 min-w-0">

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-1">
                            Custom Products
                        </h1>

                        <p className="text-primary text-lg sm:text-xl font-semibold mb-2">
                            Tailored Solutions for Your Unique Requirements
                        </p>

                        <p className="text-muted text-sm sm:text-base lg:text-lg leading-7 max-w-2xl mb-5">
                            We specialize in providing custom chemicals and solutions
                            manufactured to meet your exact specifications.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full border border-primary">
                                        <svg
                                            className="h-6 w-6 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Customized to Your Needs
                                    </h3>

                                    <p className="text-muted text-sm mt-1">
                                        Exact specifications
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-full border border-primary">
                                        <svg
                                            className="h-6 w-6 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">
                                        Quality Assured
                                    </h3>

                                    <p className="text-muted text-sm mt-1">
                                        Tested & certified
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative h-[220px] sm:h-[320px] lg:h-full lg:min-h-[340px]">
                        <Image
                            src="/Lab-test.jpg"
                            alt="Custom Products"
                            fill
                            priority
                            className="object-cover"
                        />

                        <div className="absolute inset-0 bg-black/30 theme-light:bg-black/20" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,var(--surface)_0%,transparent_45%)] lg:bg-[linear-gradient(to_right,var(--surface)_0%,rgba(10,20,40,0.92)_12%,rgba(10,20,40,0.55)_28%,transparent_55%)] theme-light:bg-[linear-gradient(to_bottom,var(--surface)_0%,transparent_45%)] theme-light:lg:bg-[linear-gradient(to_right,var(--surface)_0%,rgba(255,255,255,0.95)_12%,rgba(255,255,255,0.7)_28%,transparent_55%)]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
