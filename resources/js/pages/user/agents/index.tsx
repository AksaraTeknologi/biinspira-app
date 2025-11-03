import { Button } from '@/components/ui/button';
import { TextEffect } from '@/components/ui/text-effect';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Check, Phone, ShoppingBag, Store, Users } from 'lucide-react';

interface Agent {
    id: string;
    name: string;
    address: string;
    phone: string;
    created_at: string;
}

interface AgentsProps {
    agents: Agent[];
}

export default function Agents({ agents }: AgentsProps) {
    return (
        <UserLayout>
            <Head title="Agen & Reseller - Serena Cookies" />

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
                            <Users className="h-4 w-4" />
                            Kemitraan Bisnis
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
                                Agen
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
                                & Reseller
                            </TextEffect>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="mx-auto mt-4 max-w-2xl text-base text-amber-100 md:text-lg"
                        >
                            Bergabunglah dengan kami dan dapatkan keuntungan menarik sebagai mitra bisnis Serena Cookies
                        </motion.p>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="bg-gradient-to-b from-secondary to-amber-50 py-12 md:py-16">
                <div className="container mx-auto max-w-6xl px-4">
                    <div className="mb-12 text-center">
                        <p className="text-sm font-medium tracking-wide text-primary uppercase">Program Kemitraan</p>
                        <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">Ketentuan Agen & Reseller</h2>
                        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
                            Kami memberikan kesempatan untuk menjadi agen atau reseller produk Serena Cookies dengan berbagai keuntungan menarik
                        </p>
                    </div>

                    <div className="grid gap-8 md:grid-cols-2">
                        {/* Agen Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-primary shadow-lg">
                            <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-secondary/40 blur-3xl" aria-hidden />
                            <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-amber-50/40 blur-3xl" aria-hidden />
                            <div className="relative z-10 flex h-full flex-col p-8">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary md:h-14 md:w-14">
                                    <Store className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="font-black-mango text-2xl font-bold text-secondary md:text-3xl">Agen</h3>
                                <p className="mt-3 text-sm text-secondary/80">Program kemitraan untuk pembelian dalam jumlah besar</p>

                                <div className="my-8 h-px w-full bg-secondary/20" />

                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 rounded-full bg-secondary/90 p-1">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary">Pembelian Minimum</p>
                                            <p className="text-sm text-secondary/80">50 lusin (600 toples)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 rounded-full bg-secondary/90 p-1">
                                            <Check className="h-3 w-3 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-secondary">Diskon Spesial</p>
                                            <p className="text-sm text-secondary/80">15% untuk setiap pembelian</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 md:mt-auto">
                                    <a
                                        href="https://wa.me/6285649796210?text=Halo%2C%20saya%20tertarik%20menjadi%20Agen%20Serena%20Cookies."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="lg" variant="secondary" className="w-full gap-2">
                                            <Phone className="h-5 w-5" />
                                            Hubungi Kami
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Reseller Card */}
                        <div className="relative overflow-hidden rounded-3xl bg-secondary shadow-lg">
                            <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-primary/20 blur-3xl" aria-hidden />
                            <div className="absolute -bottom-24 -left-12 h-56 w-56 rounded-full bg-secondary-foreground/20 blur-3xl" aria-hidden />
                            <div className="relative z-10 p-8">
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary md:h-14 md:w-14">
                                    <ShoppingBag className="h-6 w-6 text-secondary" />
                                </div>
                                <h3 className="font-black-mango text-2xl font-bold text-primary md:text-3xl">Reseller</h3>
                                <p className="mt-3 text-sm text-muted-foreground">Program kemitraan dengan sistem diskon bertingkat</p>

                                <div className="my-8 h-px w-full bg-border" />

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-gray-900">
                                        <span className="text-sm font-medium">36 - 60 toples</span>
                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-secondary">6%</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-gray-900">
                                        <span className="text-sm font-medium">60 - 120 toples</span>
                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-secondary">7%</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-gray-900">
                                        <span className="text-sm font-medium">120 - 240 toples</span>
                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-secondary">8%</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-gray-900">
                                        <span className="text-sm font-medium">240 - 360 toples</span>
                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-secondary">9%</span>
                                    </div>
                                    <div className="flex items-center justify-between rounded-xl bg-primary/5 p-3 dark:bg-gray-900">
                                        <span className="text-sm font-medium">Diatas 360 toples</span>
                                        <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-secondary">10%</span>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <a
                                        href="https://wa.me/6285649796210?text=Halo%2C%20saya%20tertarik%20menjadi%20Reseller%20Serena%20Cookies."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Button size="lg" className="w-full gap-2">
                                            <Phone className="h-5 w-5" />
                                            Hubungi Kami
                                        </Button>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agents List Section */}
            {agents.length > 0 && (
                <section className="bg-gradient-to-b from-amber-50 to-secondary py-12 md:py-16">
                    <div className="container mx-auto max-w-7xl px-4">
                        <div className="mb-12 text-center">
                            <p className="text-sm font-medium tracking-wide text-primary uppercase">Daftar Agen Resmi</p>
                            <h2 className="mt-2 font-black-mango text-3xl font-bold md:text-4xl">Agen Serena Cookies</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">Temukan agen resmi Serena Cookies terdekat di kota Anda</p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                            {agents.map((agent) => (
                                <a
                                    href={`https://wa.me/${agent.phone.replace(/\D/g, '')}?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20produk%20Serena%20Cookies.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                                    key={agent.id}
                                >
                                    <div className="group relative overflow-hidden rounded-2xl bg-secondary p-6 shadow-sm transition-all duration-300 hover:shadow-lg">
                                        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-all duration-300 group-hover:bg-primary/20" />
                                        <div className="relative z-10">
                                            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors duration-300 group-hover:bg-primary">
                                                <Store className="h-6 w-6 text-primary transition-colors duration-300 group-hover:text-secondary" />
                                            </div>
                                            <h3 className="font-black-mango text-base font-bold text-primary md:text-xl">{agent.name}</h3>
                                            <div className="mt-2 space-y-3 md:mt-4">
                                                <div className="flex items-center gap-3">
                                                    <Phone className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                                                    {agent.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </a>
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
                    <h2 className="font-black-mango text-3xl font-bold text-secondary md:text-4xl">Tertarik Bergabung?</h2>
                    <p className="mx-auto mt-4 max-w-2xl text-muted/80">
                        Hubungi kami sekarang untuk informasi lebih lanjut tentang program kemitraan Serena Cookies
                    </p>
                    <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                        <a
                            href="https://wa.me/6285649796210?text=Halo%2C%20saya%20ingin%20informasi%20lebih%20lanjut%20tentang%20program%20kemitraan%20Serena%20Cookies."
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" variant="secondary" className="gap-2">
                                <Phone className="h-5 w-5" />
                                Hubungi Via WhatsApp
                            </Button>
                        </a>
                    </div>
                </div>
            </section>
        </UserLayout>
    );
}
