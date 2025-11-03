import { Button } from '@/components/ui/button';
import { type OtherItem, type ProductItem, type ServiceItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Facebook, Instagram, MapPin, Phone, ShoppingBag } from 'lucide-react';

const productItems: ProductItem[] = [
    {
        title: 'Varian Asin',
        href: '/products?variant=asin',
    },
    {
        title: 'Varian Manis',
        href: '/products?variant=manis',
    },
    {
        title: 'Varian Coklat',
        href: '/products?variant=coklat',
    },
];

const serviceItems: ServiceItem[] = [
    {
        title: 'Harga & Katalog',
        href: '/catalog',
    },
    {
        title: 'Info Agen & Reseller',
        href: '/agents',
    },
];

const otherItems: OtherItem[] = [
    {
        title: 'Tentang Kami',
        href: '/about',
    },
    {
        title: 'Hubungi Kami',
        href: '/contact',
    },
];

export default function AppFooter() {
    return (
        <footer className="bg-gradient-to-b from-amber-50 to-secondary py-8 sm:py-16">
            <div className="container mx-auto max-w-7xl px-4">
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-1">
                        <img src="/assets/images/logo.webp" alt="Serena Cookies" className="mb-2 h-24 w-auto" />
                        <h5 className="font-black-mango text-lg font-semibold">
                            Serena <span className="text-primary">Cookies</span>
                        </h5>
                        <p className="my-4 text-sm text-muted-foreground">
                            Kue kering berkualitas premium dengan cita rasa istimewa. Dibuat dengan bahan pilihan terbaik untuk kebahagiaan keluarga
                            Anda.
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
                            <span>Perumahan BPTP Blok B-7, Jl. Atletik, Kepuharjo, Kec. Karangploso, Kabupaten Malang, Jawa Timur</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 flex-shrink-0 text-primary" />
                            <a
                                href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary"
                                aria-label="Chat WhatsApp"
                            >
                                +62 856-4979-6210
                            </a>
                        </div>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-primary dark:text-secondary">Produk</h4>
                        <ul className="space-y-2">
                            {productItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-4 font-semibold text-primary dark:text-secondary">Layanan</h4>
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
                        <h4 className="mb-4 font-semibold text-primary dark:text-secondary">Lainnya</h4>
                        <ul className="space-y-2">
                            {otherItems.map((item) => (
                                <li key={item.title}>
                                    <Link href={item.href} className="text-sm text-muted-foreground hover:text-primary hover:underline">
                                        {item.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6">
                            <h4 className="mb-4 font-semibold text-primary dark:text-secondary">Ikuti Kami</h4>
                            <div className="flex items-center gap-4">
                                <a
                                    href="https://www.instagram.com/serenacookiesmalang/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    <Instagram className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://www.facebook.com/cookiesserena"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-muted-foreground hover:text-primary"
                                >
                                    <Facebook className="h-5 w-5" />
                                </a>
                                <a
                                    href="https://www.tiktok.com/@serenacookiesmalang"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="fill-muted-foreground hover:fill-primary"
                                >
                                    <svg width="20px" height="20px" viewBox="0 0 512 512" id="icons" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M412.19,118.66a109.27,109.27,0,0,1-9.45-5.5,132.87,132.87,0,0,1-24.27-20.62c-18.1-20.71-24.86-41.72-27.35-56.43h.1C349.14,23.9,350,16,350.13,16H267.69V334.78c0,4.28,0,8.51-.18,12.69,0,.52-.05,1-.08,1.56,0,.23,0,.47-.05.71,0,.06,0,.12,0,.18a70,70,0,0,1-35.22,55.56,68.8,68.8,0,0,1-34.11,9c-38.41,0-69.54-31.32-69.54-70s31.13-70,69.54-70a68.9,68.9,0,0,1,21.41,3.39l.1-83.94a153.14,153.14,0,0,0-118,34.52,161.79,161.79,0,0,0-35.3,43.53c-3.48,6-16.61,30.11-18.2,69.24-1,22.21,5.67,45.22,8.85,54.73v.2c2,5.6,9.75,24.71,22.38,40.82A167.53,167.53,0,0,0,115,470.66v-.2l.2.2C155.11,497.78,199.36,496,199.36,496c7.66-.31,33.32,0,62.46-13.81,32.32-15.31,50.72-38.12,50.72-38.12a158.46,158.46,0,0,0,27.64-45.93c7.46-19.61,9.95-43.13,9.95-52.53V176.49c1,.6,14.32,9.41,14.32,9.41s19.19,12.3,49.13,20.31c21.48,5.7,50.42,6.9,50.42,6.9V131.27C453.86,132.37,433.27,129.17,412.19,118.66Z" />
                                    </svg>
                                </a>
                            </div>
                            <p className="mt-4 text-xs text-muted-foreground">
                                Ikuti kami di media sosial untuk mendapatkan informasi terbaru tentang produk dan promo spesial.
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA dan Copyright */}
                <div className="mt-12 border-t border-secondary-foreground pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-center text-sm text-muted-foreground sm:text-left">&copy; 2025 Serena Cookies. All rights reserved.</p>
                        <Button asChild className="bg-primary">
                            <a
                                href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                            >
                                <ShoppingBag className="h-4 w-4" />
                                Pesan Sekarang
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </footer>
    );
}
