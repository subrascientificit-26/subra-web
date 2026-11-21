'use client';
import {
    ClipboardList,
    FlaskConical,
    Settings,
    BadgeCheck,
    Truck,
} from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { PAGE_CONTAINER_CLASS } from '@/lib/layout';

export default function CustomizationProcess() {
    const steps = [
        {
            number: 1,
            title: 'Submit Requirement',
            description: 'Share your product specifications',
            icon: <ClipboardList size={30} />,
        },
        {
            number: 2,
            title: 'Feasibility & Quote',
            description: 'We analyze & provide feasibility and quote',
            icon: <FlaskConical size={30} />,
        },
        {
            number: 3,
            title: 'Development & Testing',
            description: 'Product developed and rigorously tested',
            icon: <Settings size={30} />,
        },
        {
            number: 4,
            title: 'Approval & Production',
            description: 'Approval from you and bulk production',
            icon: <BadgeCheck size={30} />,
        },
        {
            number: 5,
            title: 'Delivery',
            description: 'On-time delivery to your location',
            icon: <Truck size={30} />,
        },
    ];

    return (
        <div className="w-full bg-background text-foreground">

            <div className={PAGE_CONTAINER_CLASS}>

                <div className="border border-border rounded-2xl bg-surface px-4 py-6 sm:px-6 xl:px-8 xl:py-6 shadow-sm theme-dark:shadow-lg theme-light:shadow-md mt-8 sm:mt-10">

                    <h2 className="text-lg sm:text-2xl xl:text-xl font-bold text-center text-foreground">
                        OUR CUSTOMIZATION PROCESS
                    </h2>

                    <div className="hidden xl:flex items-start justify-between gap-2 mt-6">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex flex-1 min-w-0 items-center justify-center">

                                <div className="flex flex-col items-center text-center min-w-0 flex-1 px-2">

                                    <div className="h-16 w-16 rounded-full border-2 border-primary text-primary mb-4 flex items-center justify-center shrink-0">
                                        {step.icon}
                                    </div>

                                    <h3 className="font-semibold text-sm text-foreground flex items-center justify-center">
                                        {step.title}
                                    </h3>

                                    <p className="text-muted text-xs 2xl:text-sm leading-5 mt-2 flex items-start justify-center">
                                        {step.description}
                                    </p>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="flex items-center px-1 shrink-0">
                                        <div className="w-6 2xl:w-10 border-t-2 border-dashed border-primary"></div>

                                        <ArrowRight
                                            size={18}
                                            className="text-primary -ml-1 flex-shrink-0"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="xl:hidden mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

                        {steps.map((step) => (
                            <div
                                key={step.number}
                                className="flex gap-4 border border-border rounded-xl p-4 bg-surface-elevated"
                            >

                                <div className="flex-shrink-0">
                                    <div className="flex items-center justify-center h-14 w-14 rounded-full border-2 border-primary bg-primary/10 text-2xl text-primary">
                                        {step.icon}
                                    </div>
                                </div>

                                <div>

                                    <h3 className="font-semibold text-base mb-1 text-foreground">
                                        {step.title}
                                    </h3>

                                    <p className="text-muted text-sm leading-6">
                                        {step.description}
                                    </p>

                                </div>

                            </div>
                        ))}

                    </div>

                </div>

            </div>

        </div>
    );
}
