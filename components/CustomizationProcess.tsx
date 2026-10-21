'use client';
import {
    ClipboardList,
    FlaskConical,
    Settings,
    BadgeCheck,
    Truck,
} from 'lucide-react';
import { ArrowRight } from 'lucide-react';

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

            <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 py-0">

                <div className="border border-border rounded-2xl bg-surface px-6 py-6 md:px-20 md:py-4 shadow-lg theme-light:shadow-m mt-10">

                    <h2 className="text-2xl md:text-xl font-bold text-center text-foreground">
                        OUR CUSTOMIZATION PROCESS
                    </h2>

                    <div className="hidden md:flex items-start justify-center gap-5 mt-6">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">

                                <div className="flex flex-col items-center text-center w-[170px] flex-shrink-0">

                                    <div className="h-16 w-16 rounded-full border-2 border-primary text-primary mb-4 flex items-center justify-center">
                                        {step.icon}
                                    </div>

                                    <h3 className="font-semibold text-sm text-foreground whitespace-nowrap h-[20px] flex items-center">
                                        {step.title}
                                    </h3>

                                    <p className="text-muted text-sm leading-6 mt-2 h-[48px] flex items-start justify-center">
                                        {step.description}
                                    </p>
                                </div>

                                {index < steps.length - 1 && (
                                    <div className="flex items-center px-4">
                                        <div className="w-16 border-t-2 border-dashed border-primary"></div>

                                        <ArrowRight
                                            size={20}
                                            className="text-primary -ml-1 flex-shrink-0"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="md:hidden mt-10 space-y-5">

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
