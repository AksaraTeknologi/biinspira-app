import { type OtherItem, type ServiceItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Facebook, HeartHandshake, HelpCircle, Instagram, Mail, MapPin } from 'lucide-react';

const serviceItems: ServiceItem[] = [
    {
        title: 'Ad Performance',
        href: '/dashboard/ads',
    },
    {
        title: 'Marketing Plans',
        href: '/dashboard/plans',
    },
    {
        title: 'Analytics',
        href: '/dashboard/analytics',
    },
];

const otherItems: OtherItem[] = [
    {
        title: 'Documentation',
        href: '/docs',
    },
    {
        title: 'Support',
        href: '/support',
    },
    {
        title: 'API Reference',
        href: '/api-docs',
    },
];

export default function AppFooter() {
    return (
        <footer className="bg-gradient-to-b from-slate-50 to-slate-100 py-8 sm:py-16">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <img src="/assets/images/logo.webp" alt="Biinspira" className="mb-2 h-12 w-auto" />
                        <h5 className="text-lg font-semibold">Biinspira</h5>
                        <p className="my-4 text-sm text-muted-foreground">
                            Simplified marketing analytics and performance monitoring platform. Make data-driven decisions for your business growth.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>Malang, East Java, Indonesia</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 flex-shrink-0 text-primary" />
                            <a href="mailto:support@biinspira.com" className="hover:text-primary">
                                support@biinspira.com
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-primary">Features</h4>
                        <ul className="space-y-2">
                            {serviceItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-primary">Resources</h4>
                        <ul className="space-y-2">
                            {otherItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-primary">Contact & Support</h4>
                        <div className="flex flex-col gap-4">
                            <Link href="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                                <HelpCircle className="h-4 w-4" />
                                Help Center
                            </Link>
                            <Link href="/partnership" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                                <HeartHandshake className="h-4 w-4" />
                                Partnership
                            </Link>
                        </div>
                        <div className="mt-6">
                            <h4 className="mb-4 font-semibold text-primary">Follow Us</h4>
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.instagram.com/biinspira"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://www.facebook.com/biinspira"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    <Facebook className="h-5 w-5" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 border-t border-slate-200 pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-center text-sm text-muted-foreground sm:text-left">
                            &copy; {new Date().getFullYear()} Biinspira. All rights reserved.
                        </p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                            <Link href="/privacy" className="hover:text-primary">
                                Privacy Policy
                            </Link>
                            <Link href="/terms" className="hover:text-primary">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
