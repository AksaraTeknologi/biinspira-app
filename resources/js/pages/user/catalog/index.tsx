import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Gift, MessageCircle, Package, ShoppingBag, Sparkles } from 'lucide-react';

interface Catalog {
    id: string;
    title: string;
    description?: string;
    image?: string;
}

interface Hamper {
    id: string;
    name: string;
    description?: string;
    price: number;
    image?: string;
}

interface CatalogProps {
    catalogs: Catalog[];
    hampers: Hamper[];
}

export default function Catalog({ catalogs, hampers }: CatalogProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    return (
        <UserLayout>
            <Head title="Harga & Katalog - Serena Cookies" />

            {/* Hero Section */}
            <section className="relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/assets/images/all-variant.jpg')" }}>
                <div className="absolute inset-0 bg-primary/70" aria-hidden />
                <div className="relative z-10 container mx-auto max-w-7xl px-4 pt-32 pb-16 md:pt-40 md:pb-24">
                    <div className="space-y-4 text-center text-white md:space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-medium text-amber-900 md:text-sm"
                        >
                            <BookOpen className="h-4 w-4" />
                            Katalog Produk
                        </motion.div>

                        <div className="flex justify-center gap-1.5 font-black-mango text-4xl font-bold tracking-tight sm:text-5xl md:gap-3 md:text-6xl lg:text-7xl">
                            <TextEffect
                                per="char"
                                delay={0.5}
                                variants={{
                                    container: {
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.05 },
                                        },
                                    },
                                    item: {
                                        hidden: { opacity: 0, rotateX: 90, y: 10 },
                                        visible: {
                                            opacity: 1,
                                            rotateX: 0,
                                            y: 0,
                                            transition: { duration: 0.2 },
                                        },
                                    },
                                }}
                            >
                                Harga
                            </TextEffect>
                            <TextEffect
                                per="char"
                                delay={0.5}
                                variants={{
                                    container: {
                                        hidden: { opacity: 0 },
                                        visible: {
                                            opacity: 1,
                                            transition: { staggerChildren: 0.05 },
                                        },
                                    },
                                    item: {
                                        hidden: { opacity: 0, rotateX: 90, y: 10 },
                                        visible: {
                                            opacity: 1,
                                            rotateX: 0,
                                            y: 0,
                                            transition: { duration: 0.2 },
                                        },
                                    },
                                }}
                                className="text-amber-200"
                            >
                                & Katalog
                            </TextEffect>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mx-auto mt-4 max-w-2xl text-base text-amber-100 md:text-lg"
                        >
                            Jelajahi katalog lengkap produk kami dengan berbagai varian dan paket hampers eksklusif untuk momen spesial Anda
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Catalogs Section */}
            {catalogs.length > 0 && (
                <section className="bg-gradient-to-b from-secondary to-amber-50 py-12 md:py-16">
                    <div className="container mx-auto max-w-7xl px-4">
                        <div className="mb-12 text-center">
                            <p className="text-sm font-medium tracking-wide text-primary uppercase">Katalog Serena Cookies</p>
                            <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">Katalog Produk Kami</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                                Lihat katalog lengkap produk kami untuk informasi detail tentang varian dan harga
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {catalogs.map((catalog, index) => (
                                <motion.div
                                    key={catalog.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative overflow-hidden rounded-2xl bg-secondary shadow-sm transition-all duration-300 hover:shadow-xl"
                                >
                                    <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />

                                    {/* Image */}
                                    {catalog.image && (
                                        <div className="relative overflow-hidden rounded-t-2xl">
                                            <img
                                                src={`/storage/${catalog.image}`}
                                                alt={catalog.title}
                                                className="h-full object-cover transition-transform duration-300"
                                            />
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="relative z-10 p-6">
                                        <div className="mb-4 hidden h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary md:inline-flex">
                                            <Package className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-secondary" />
                                        </div>
                                        <h3 className="font-black-mango text-lg font-bold text-primary md:text-xl">{catalog.title}</h3>
                                        {catalog.description && (
                                            <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{catalog.description}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Hampers Section */}
            {hampers.length > 0 && (
                <section className="bg-gradient-to-b from-amber-50 to-secondary py-12 md:py-16">
                    <div className="container mx-auto max-w-7xl px-4">
                        <div className="mb-12 text-center">
                            <p className="text-sm font-medium tracking-wide text-primary uppercase">Paket Hampers</p>
                            <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">Paket Hampers Eksklusif</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                                Hadiah sempurna untuk momen spesial dengan kemasan premium dan pilihan varian terbaik
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 lg:grid-cols-3">
                            {hampers.map((hamper, index) => (
                                <motion.div
                                    key={hamper.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="group relative flex flex-col overflow-hidden rounded-2xl bg-secondary shadow-sm transition-all duration-300 hover:shadow-xl"
                                >
                                    <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />

                                    {/* Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl">
                                        {hamper.image ? (
                                            <img
                                                src={`/storage/${hamper.image}`}
                                                alt={hamper.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-primary/5">
                                                <Gift className="h-20 w-20 text-primary/30" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-semibold text-white">
                                            Hampers
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="relative z-10 flex flex-1 flex-col p-5">
                                        <h3 className="line-clamp-2 font-black-mango text-xl font-bold text-primary">{hamper.name}</h3>

                                        {hamper.description && <p className="mt-2 text-sm text-muted-foreground">{hamper.description}</p>}

                                        <div className="mt-4 flex-1">
                                            <div className="flex flex-col justify-between border-t border-border/50 pt-4 md:flex-row md:items-center">
                                                <span className="text-xs font-medium text-muted-foreground">Harga Mulai</span>
                                                <span className="font-black-mango text-xl font-bold text-primary">{formatPrice(hamper.price)}</span>
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <a
                                                href={`https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20Hampers%20${encodeURIComponent(hamper.name)}%20dari%20Serena%20Cookies.`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                <Button size="sm" className="w-full gap-2 group-hover:bg-primary/90">
                                                    <ShoppingBag className="hidden h-4 w-4 sm:block" />
                                                    Pesan Sekarang
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-primary py-16">
                <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-secondary/40 blur-3xl" aria-hidden />
                <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-50/40 blur-3xl" aria-hidden />
                <div className="container mx-auto max-w-4xl px-4 text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-secondary" />
                    <h2 className="mt-4 font-black-mango text-3xl font-bold text-secondary md:text-4xl">Siap Memesan Produk Favorit Anda?</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-muted/80">
                        Hubungi kami sekarang melalui WhatsApp untuk pemesanan dan konsultasi produk yang sesuai dengan kebutuhan Anda
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                        <a
                            href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button
                                size="lg"
                                variant="secondary"
                                className="gap-2 bg-green-200 text-green-800 hover:bg-green-200 hover:text-green-900"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Pesan Via WhatsApp
                            </Button>
                        </a>
                        <Link href="/products">
                            <Button size="lg" variant="outline" className="gap-2">
                                Lihat Semua Produk
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
