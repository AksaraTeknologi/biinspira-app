import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ArrowRight, Cookie, ShoppingBag, Sparkles } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price_regular: number;
    price_jar?: number;
    image?: string;
    description?: string;
    variant: {
        id: string;
        name: string;
    };
}

interface Variant {
    id: string;
    name: string;
    products_count: number;
    description?: string;
}

interface ProductsProps {
    products: Product[];
    variants: Variant[];
    currentVariant?: Variant | null;
    variantFilter?: string;
}

export default function Products({ products, variants, currentVariant, variantFilter }: ProductsProps) {
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const getVariantAccent = (variantName: string) => {
        const name = variantName.toLowerCase();
        if (name.includes('asin')) return 'bg-orange-500';
        if (name.includes('manis')) return 'bg-yellow-500';
        if (name.includes('coklat')) return 'bg-amber-900';
        return 'bg-primary';
    };

    return (
        <UserLayout>
            <Head title={currentVariant ? `${currentVariant.name} - Serena Cookies` : 'Produk - Serena Cookies'} />

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
                            <Cookie className="h-4 w-4" />
                            {currentVariant ? `Varian ${currentVariant.name}` : 'Semua Produk'}
                        </motion.div>

                        <div className="flex justify-center gap-1.5 font-black-mango text-4xl font-bold tracking-tight sm:text-5xl md:gap-3 md:text-6xl lg:text-7xl">
                            {currentVariant ? (
                                <>
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
                                        Varian
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
                                        {currentVariant.name}
                                    </TextEffect>
                                </>
                            ) : (
                                <>
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
                                        Semua
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
                                        Produk
                                    </TextEffect>
                                </>
                            )}
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mx-auto mt-4 max-w-2xl text-base text-amber-100 md:text-lg"
                        >
                            {currentVariant
                                ? currentVariant.description || `Nikmati kelezatan kue kering varian ${currentVariant.name} dari Serena Cookies`
                                : 'Jelajahi koleksi lengkap kue kering premium kami dengan berbagai varian rasa yang menggugah selera'}
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Filter Tabs */}
            <section className="sticky top-16 z-40 bg-secondary/20 py-4 backdrop-blur-md">
                <div className="container mx-auto max-w-7xl px-4">
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link href="/products">
                            <Button variant={!variantFilter ? 'default' : 'outline'} size="sm" className="gap-2">
                                Semua Produk
                            </Button>
                        </Link>
                        {variants.map((variant) => {
                            const isActive = variantFilter?.toLowerCase() === variant.name.toLowerCase();
                            return (
                                <Link key={variant.id} href={`/products?variant=${variant.name.toLowerCase()}`}>
                                    <Button variant={isActive ? 'default' : 'outline'} size="sm" className="gap-2">
                                        {variant.name}
                                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">{variant.products_count}</span>
                                    </Button>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Products Grid */}
            <section className="bg-gradient-to-b from-secondary to-amber-50 pt-8 pb-24">
                <div className="container mx-auto max-w-7xl px-4">
                    {products.length > 0 ? (
                        <>
                            <div className="mb-8 text-center">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Menampilkan {products.length} produk {currentVariant && `dari varian ${currentVariant.name}`}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-6 lg:grid-cols-3 xl:grid-cols-4">
                                {products.map((product, index) => (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: index * 0.1 }}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl bg-secondary shadow-sm transition-all duration-300 hover:shadow-xl"
                                    >
                                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />

                                        {/* Image */}
                                        <div className="relative aspect-square overflow-hidden rounded-t-2xl">
                                            {product.image ? (
                                                <img
                                                    src={`/storage/${product.image}`}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-primary/5">
                                                    <Cookie className="h-16 w-16 text-primary/30" />
                                                </div>
                                            )}
                                            <div
                                                className={`absolute top-3 left-3 rounded-full ${getVariantAccent(product.variant.name)} px-3 py-1 text-xs font-semibold text-white`}
                                            >
                                                {product.variant.name}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10 flex flex-1 flex-col p-5">
                                            <h3 className="line-clamp-2 font-black-mango text-lg font-bold text-primary">{product.name}</h3>

                                            {product.description && (
                                                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
                                            )}

                                            <div className="mt-4 flex-1 space-y-2">
                                                <div className="flex flex-col justify-between sm:flex-row sm:items-center">
                                                    <span className="text-xs font-medium text-muted-foreground">Harga Plastik</span>
                                                    <span className="font-black-mango text-lg font-bold text-primary">
                                                        {formatPrice(product.price_regular)}
                                                    </span>
                                                </div>
                                                {product.price_jar ? (
                                                    <div className="flex flex-col justify-between border-t border-border/50 pt-2 sm:flex-row sm:items-center">
                                                        <span className="text-xs font-medium text-muted-foreground">Harga Toples</span>
                                                        <span className="font-black-mango text-lg font-bold text-primary">
                                                            {formatPrice(product.price_jar)}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>

                                            <div className="mt-4">
                                                <a
                                                    href={`https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20${encodeURIComponent(product.name)}%20dari%20Serena%20Cookies.`}
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
                        </>
                    ) : (
                        <div className="py-20 text-center">
                            <Cookie className="mx-auto h-16 w-16 text-muted-foreground/50" />
                            <h3 className="mt-4 font-black-mango text-xl font-semibold text-muted-foreground">Produk Tidak Ditemukan</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {currentVariant ? `Belum ada produk untuk varian ${currentVariant.name}` : 'Belum ada produk yang tersedia'}
                            </p>
                            <Link href="/products">
                                <Button variant="outline" className="mt-6 gap-2">
                                    Lihat Semua Produk
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative overflow-hidden bg-primary py-16">
                <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-secondary/40 blur-3xl" aria-hidden />
                <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-50/40 blur-3xl" aria-hidden />
                <div className="container mx-auto max-w-4xl px-4 text-center">
                    <Sparkles className="mx-auto h-12 w-12 text-secondary" />
                    <h2 className="mt-4 font-black-mango text-3xl font-bold text-secondary md:text-4xl">Pesan Produk Favorit Anda Sekarang!</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-muted/80">
                        Hubungi kami melalui WhatsApp untuk pemesanan dan informasi lebih lanjut tentang produk Serena Cookies
                    </p>
                    <div className="mt-8">
                        <a
                            href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20memesan%20produk%20Serena%20Cookies."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" variant="secondary" className="gap-2">
                                <ShoppingBag className="h-5 w-5" />
                                Pesan Via WhatsApp
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
