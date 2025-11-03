import { Button } from '@/components/ui/button';
import { InfiniteSlider } from '@/components/ui/infinite-slider';
import { TextEffect } from '@/components/ui/text-effect';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Award, Clock, Cookie, Gift, MapPin, Package, ShoppingBag, Sparkles } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price_regular: number;
    price_jar?: number;
    image?: string;
    variant: {
        name: string;
    };
}

interface Variant {
    id: string;
    name: string;
    products_count: number;
    description?: string;
}

interface HomeProps {
    all_products: Product[];
    variants: Variant[];
}

export default function Home({ all_products, variants }: HomeProps) {
    return (
        <UserLayout>
            <Head title="Serena Cookies - Kue Kering Berkualitas Premium" />

            {/* Hero Section */}
            <section className="relative bg-gradient-to-b from-amber-50 to-secondary">
                <div className="container mx-auto max-w-7xl px-4 pt-20 pb-10 md:pt-32 md:pb-16">
                    <div className="grid gap-8 lg:grid-cols-5 lg:gap-12">
                        <div className="col-span-3 flex flex-col justify-center space-y-4 md:space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs font-medium text-amber-900 md:text-sm"
                            >
                                <Sparkles className="h-4 w-4" />
                                Kue Kering Premium
                            </motion.div>
                            <div className="flex gap-1.5 font-black-mango text-4xl font-bold tracking-tight sm:text-5xl md:gap-3 md:text-6xl lg:text-7xl">
                                <TextEffect
                                    per="char"
                                    delay={0.5}
                                    variants={{
                                        container: {
                                            hidden: {
                                                opacity: 0,
                                            },
                                            visible: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.05,
                                                },
                                            },
                                        },
                                        item: {
                                            hidden: {
                                                opacity: 0,
                                                rotateX: 90,
                                                y: 10,
                                            },
                                            visible: {
                                                opacity: 1,
                                                rotateX: 0,
                                                y: 0,
                                                transition: {
                                                    duration: 0.2,
                                                },
                                            },
                                        },
                                    }}
                                >
                                    Serena
                                </TextEffect>
                                <TextEffect
                                    per="char"
                                    delay={0.5}
                                    variants={{
                                        container: {
                                            hidden: {
                                                opacity: 0,
                                            },
                                            visible: {
                                                opacity: 1,
                                                transition: {
                                                    staggerChildren: 0.05,
                                                },
                                            },
                                        },
                                        item: {
                                            hidden: {
                                                opacity: 0,
                                                rotateX: 90,
                                                y: 10,
                                            },
                                            visible: {
                                                opacity: 1,
                                                rotateX: 0,
                                                y: 0,
                                                transition: {
                                                    duration: 0.2,
                                                },
                                            },
                                        },
                                    }}
                                    className="text-primary"
                                >
                                    Cookies
                                </TextEffect>
                            </div>
                            <TextEffect per="word" delay={1} speedReveal={2} className="text-base">
                                Kue kering berkualitas premium dengan cita rasa istimewa. Dibuat dengan bahan pilihan terbaik untuk kebahagiaan
                                keluarga Anda.
                            </TextEffect>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 1.5 }}
                                className="flex flex-col gap-3 sm:flex-row"
                            >
                                <Button size="lg" className="gap-2">
                                    <ShoppingBag className="h-5 w-5" />
                                    Pesan Sekarang
                                </Button>
                                <Button size="lg" variant="outline">
                                    Lihat Katalog
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </motion.div>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            className="relative col-span-3 md:col-span-2"
                        >
                            <img
                                src="/assets/images/all-variant.jpg"
                                alt="All Variant Serena Cookies"
                                className="w-full rounded-3xl border-4 border-primary"
                            />
                            {/* Floating badges */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 1.2 }}
                                className="absolute top-8 -right-4 rounded-2xl bg-secondary p-4 shadow-xl dark:bg-gray-900"
                            >
                                <Cookie className="h-6 w-6 text-secondary-foreground md:h-8 md:w-8" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 1.4 }}
                                className="absolute bottom-8 -left-4 rounded-2xl bg-secondary p-4 shadow-xl dark:bg-gray-900"
                            >
                                <Award className="h-6 w-6 text-green-600 md:h-8 md:w-8" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Products Infinite Slider */}
            <div className="h-32 overflow-hidden bg-secondary md:h-40">
                <InfiniteSlider gap={24} reverse className="mt-8 -ml-[5%] w-[110%] -rotate-2 bg-primary p-4 md:py-5">
                    {all_products.map((product, index) => (
                        <>
                            <h3 key={`name-${product.id}-${index}`} className="font-black-mango text-lg font-semibold text-secondary md:text-xl">
                                {product.name}
                            </h3>
                            <Cookie key={`icon-${product.id}-${index}`} className="h-8 w-8 text-secondary-foreground" />
                        </>
                    ))}
                </InfiniteSlider>
            </div>

            {/* Features Section */}
            <section className="bg-gradient-to-b from-secondary to-muted/30 py-12">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="mb-12 text-center">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">Kenapa Memilih Kami</p>
                        <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">Mengapa Banyak yang Memilih Serena Cookies</h2>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-sm">
                            <div className="absolute -right-12 -bottom-24 h-56 w-56 rounded-full bg-secondary-foreground/30 blur-3xl" aria-hidden />
                            <div className="p-8">
                                <h3 className="font-black-mango text-5xl font-bold text-primary">3.000+</h3>
                                <p className="mt-3 text-lg font-semibold">Pelanggan Setia</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Lebih dari 3.000 pelanggan telah mempercayakan momen spesial mereka bersama Serena Cookies.
                                </p>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-sm">
                            <div className="z-20 flex flex-col gap-4 p-8">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-6 w-6 text-primary" />
                                    <h3 className="font-black-mango text-xl font-semibold text-primary md:text-2xl">Pengiriman Cepat & Fleksibel</h3>
                                </div>
                                <p className="z-40 text-sm text-muted-foreground">
                                    Pesanan dapat dikirim kapan saja sesuai kebutuhan Anda, dengan kemasan tetap aman dan rapi.
                                </p>
                            </div>
                            <div className="absolute right-2 -bottom-24 md:-bottom-18 lg:right-12">
                                <div className="relative">
                                    <div className="absolute inset-0 rounded-full bg-secondary-foreground/30 blur-3xl" />
                                    <img
                                        src="/assets/images/rocket.png"
                                        alt="Pengiriman Cepat"
                                        className="relative h-44 text-primary drop-shadow-lg"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-sm">
                            <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-secondary-foreground/30 blur-3xl" aria-hidden />
                            <div className="absolute -top-24 left-2/3 h-44 w-44 -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" aria-hidden />
                            <div className="relative p-8">
                                <div className="space-y-4 md:w-1/2">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black-mango text-xl font-semibold text-primary md:text-2xl">Kualitas Terjaga</h3>
                                        <Sparkles className="h-6 w-6 text-primary" />
                                    </div>
                                    <p className="mt-2 mb-8 text-sm text-muted-foreground lg:mb-20">
                                        Nikmati kualitas dan cita rasa yang konsisten. Kami menggunakan bahan pilihan serta proses produksi yang
                                        terstandarisasi. Komitmen ini menjamin setiap toples Serena Cookies selalu menghadirkan kenikmatan yang sama,
                                        baik untuk keseharian maupun momen spesial bersama keluarga.
                                    </p>
                                </div>
                                <img
                                    src="/assets/images/about.jpg"
                                    alt="Kualitas Terjaga"
                                    className="right-16 bottom-0 w-[420px] rounded-2xl lg:absolute lg:rounded-t-2xl lg:rounded-b-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Variants Section */}
            <section className="bg-gradient-to-b from-muted/30 to-secondary py-8 md:py-12">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="rounded-3xl bg-white p-6 shadow-sm md:p-10">
                        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                            <div className="md:w-1/2">
                                <p className="text-sm font-medium tracking-wide text-primary uppercase">VARIAN SERENA COOKIES</p>
                                <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">
                                    Nikmati Beragam Pilihan Kelezatan Setiap Gigitan
                                </h2>
                            </div>
                            <div className="text-gray-600 md:w-1/2">
                                <p>
                                    Setiap varian Serena Cookies dibuat dengan bahan pilihan dan resep istimewa, menghadirkan cita rasa yang berbeda
                                    untuk setiap selera. Temukan varian favoritmu di bawah ini.
                                </p>
                            </div>
                        </div>

                        <div className="my-8 h-px w-full bg-gray-200" />

                        <div className="grid gap-8 sm:grid-cols-2 md:gap-10 lg:grid-cols-3">
                            {variants.map((variant) => {
                                return (
                                    <Link key={variant.id} href={`/products?variant=${variant.name.toLowerCase()}`}>
                                        <div className="group flex cursor-pointer flex-col items-center rounded-2xl bg-secondary p-6 text-center shadow transition-colors duration-200 hover:bg-primary">
                                            <h3 className="font-black-mango text-xl font-semibold text-primary transition-colors duration-200 group-hover:text-secondary md:text-2xl">
                                                {variant.name}
                                            </h3>
                                            {variant.description ? (
                                                <p className="mt-2 mb-2 text-sm text-gray-600 transition-colors duration-200 group-hover:text-secondary">
                                                    {variant.description}
                                                </p>
                                            ) : (
                                                <p className="mt-2 mb-2 text-sm text-gray-600 italic transition-colors duration-200 group-hover:text-secondary">
                                                    Deskripsi belum tersedia
                                                </p>
                                            )}
                                            <p className="my-4 text-xs text-gray-600 italic transition-colors duration-200 group-hover:text-secondary">
                                                {variant.products_count} produk tersedia dari varian ini.
                                            </p>
                                            <div className="flex justify-center">
                                                <Button variant="outline" className="gap-2 group-hover:hidden">
                                                    Lihat Produk
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                                <Button variant="secondary" className="hidden gap-2 group-hover:inline-flex">
                                                    Lihat Produk
                                                    <ArrowRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* Hampers Info Section */}
            <section className="bg-primary py-16">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                        <div className="flex flex-col justify-center space-y-6">
                            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-foreground px-4 py-2 text-sm font-medium text-white">
                                <Gift className="h-4 w-4" />
                                Paket Hampers
                            </div>
                            <h2 className="font-black-mango text-3xl font-bold text-secondary md:text-4xl">Hadiah Sempurna untuk Orang Terkasih</h2>
                            <p className="text-lg text-muted/80">
                                Kami menyediakan paket hampers eksklusif yang cocok untuk berbagai momen spesial Anda. Setiap paket dikemas dengan
                                indah dan penuh cinta.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-secondary-foreground p-2">
                                        <Package className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-secondary">Kemasan Premium dengan Toples Berkualitas</h4>
                                        <p className="text-sm text-muted/80">Toples yang cantik dan dapat digunakan kembali</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-secondary-foreground p-2">
                                        <Gift className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-secondary">Bonus Greeting Card</h4>
                                        <p className="text-sm text-muted/80">Kartu ucapan spesial untuk momen istimewa Anda</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full bg-secondary-foreground p-2">
                                        <Sparkles className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-secondary">Paket Dapat Disesuaikan</h4>
                                        <p className="text-sm text-muted/80">Pilih varian sesuai selera dan kebutuhan Anda</p>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2">
                                <Link href="/hampers">
                                    <Button size="lg" variant="outline" className="gap-2">
                                        Lihat Paket Hampers
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                        <img
                            src="/assets/images/hampers.jpg"
                            alt="Paket Hampers Serena Cookies"
                            className="rounded-3xl border-4 border-secondary-foreground shadow-lg"
                        />
                    </div>
                </div>
            </section>

            {/* Location Section */}
            <section className="bg-gradient-to-b from-secondary to-amber-50 py-20">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="mb-12 text-center">
                        <h2 className="mb-4 font-black-mango text-3xl font-bold md:text-4xl">Kunjungi Toko Kami</h2>
                        <p className="text-lg text-muted-foreground">Temukan lokasi toko kami dan belanja langsung kue kering favorit Anda</p>
                    </div>

                    <div className="grid gap-8 lg:grid-cols-2">
                        <div className="space-y-6">
                            <div className="rounded-3xl bg-secondary shadow-sm">
                                <div className="p-6">
                                    <div className="mb-4 flex items-center gap-3">
                                        <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/30">
                                            <MapPin className="h-6 w-6 text-primary dark:text-amber-400" />
                                        </div>
                                        <h3 className="font-black-mango text-xl font-semibold">Alamat Toko</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium">Serena Cookies</p>
                                            <p className="text-sm text-muted-foreground">
                                                Perumahan BPTP Blok B-7, Jl. Atletik, Kepuharjo, Kec. Karangploso, Kabupaten Malang, Jawa Timur
                                            </p>
                                        </div>
                                        <div className="pt-4">
                                            <h4 className="mb-2 font-medium">Jam Operasional:</h4>
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>Senin - Jumat: 08.00 - 20.00 WIB</p>
                                                <p>Sabtu - Minggu: 08.00 - 21.00 WIB</p>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <h4 className="mb-2 font-medium">Kontak:</h4>
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>
                                                    WhatsApp:{' '}
                                                    <a
                                                        href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary"
                                                        aria-label="Chat WhatsApp"
                                                    >
                                                        +62 856-4979-6210
                                                    </a>
                                                </p>
                                                <p>
                                                    Instagram:{' '}
                                                    <a
                                                        href="https://www.instagram.com/serenacookiesmalang/"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary"
                                                    >
                                                        @serenacookiesmalang
                                                    </a>
                                                </p>
                                                <p>
                                                    Facebook:{' '}
                                                    <a
                                                        href="https://www.facebook.com/cookiesserena"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary"
                                                    >
                                                        Serena Cookies Malang
                                                    </a>
                                                </p>
                                                <p>
                                                    Tiktok:{' '}
                                                    <a
                                                        href="https://www.tiktok.com/@serenacookiesmalang"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-muted-foreground hover:text-primary"
                                                    >
                                                        @serenacookiesmalang
                                                    </a>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="min-h-[400px] overflow-hidden rounded-xl border">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d553.2967313010594!2d112.62540980340901!3d-7.913166332428869!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sid!2sid!4v1761537989785!5m2!1sid!2sid"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            ></iframe>
                        </div>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
