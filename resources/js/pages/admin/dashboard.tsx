import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { rupiahFormatter } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Box, Folder, Image, Package, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
];

interface Product {
    id: string;
    name: string;
    price_regular: number;
    variant: {
        name: string;
    };
    created_at: string;
}

interface Hamper {
    id: string;
    name: string;
    price: number;
    created_at: string;
}

interface Agent {
    id: string;
    name: string;
    phone?: string;
    created_at: string;
}

interface ProductByVariant {
    name: string;
    count: number;
}

interface DashboardProps {
    stats: {
        total_variants: number;
        total_products: number;
        total_hampers: number;
        total_catalogs: number;
        total_agents: number;
    };
    recent_products: Product[];
    recent_hampers: Hamper[];
    recent_agents: Agent[];
    products_by_variant: ProductByVariant[];
}

export default function Dashboard({ stats, recent_products, recent_hampers, recent_agents, products_by_variant }: DashboardProps) {
    const statsData = [
        {
            title: 'Total Varian',
            value: stats.total_variants,
            icon: Folder,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20',
            href: '/admin/variants',
        },
        {
            title: 'Total Produk',
            value: stats.total_products,
            icon: Package,
            color: 'text-green-600',
            bgColor: 'bg-green-100 dark:bg-green-900/20',
            href: '/admin/products',
        },
        {
            title: 'Total Hampers',
            value: stats.total_hampers,
            icon: Box,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100 dark:bg-purple-900/20',
            href: '/admin/hampers',
        },
        {
            title: 'Total Katalog',
            value: stats.total_catalogs,
            icon: Image,
            color: 'text-orange-600',
            bgColor: 'bg-orange-100 dark:bg-orange-900/20',
            href: '/admin/catalogs',
        },
        {
            title: 'Total Agen',
            value: stats.total_agents,
            icon: Users,
            color: 'text-pink-600',
            bgColor: 'bg-pink-100 dark:bg-pink-900/20',
            href: '/admin/agents',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-semibold">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Selamat datang di dashboard admin Serena Cookies</p>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {statsData.map((stat) => (
                        <Link key={stat.title} href={stat.href}>
                            <Card className="transition-all hover:cursor-pointer hover:shadow-md">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                                    <div className={`rounded-full p-2 ${stat.bgColor}`}>
                                        <stat.icon className={`h-4 w-4 ${stat.color}`} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {/* Charts and Recent Data */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Products by Variant */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Produk per Varian</CardTitle>
                            <CardDescription>Distribusi produk berdasarkan varian</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {products_by_variant.length > 0 ? (
                                <div className="space-y-4">
                                    {products_by_variant.map((item, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                                                    <Package className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-sm text-muted-foreground">{item.count} produk</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full bg-primary"
                                                        style={{
                                                            width: `${(item.count / Math.max(...products_by_variant.map((p) => p.count))) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">Belum ada data</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Products */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Produk Terbaru</CardTitle>
                            <CardDescription>5 produk yang baru ditambahkan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recent_products.length > 0 ? (
                                <div className="space-y-4">
                                    {recent_products.map((product) => (
                                        <div key={product.id} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">{product.variant.name}</p>
                                            </div>
                                            <p className="font-semibold">{rupiahFormatter.format(product.price_regular)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">Belum ada produk</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Tables */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent Hampers */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Hampers Terbaru</CardTitle>
                            <CardDescription>5 hampers yang baru ditambahkan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recent_hampers.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead className="text-right">Harga</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_hampers.map((hamper) => (
                                            <TableRow key={hamper.id}>
                                                <TableCell className="font-medium">{hamper.name}</TableCell>
                                                <TableCell className="text-right">{rupiahFormatter.format(hamper.price)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">Belum ada hampers</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Agents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Agen Terbaru</CardTitle>
                            <CardDescription>5 agen yang baru ditambahkan</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recent_agents.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nama</TableHead>
                                            <TableHead className="text-right">No. Telepon</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recent_agents.map((agent) => (
                                            <TableRow key={agent.id}>
                                                <TableCell className="font-medium">{agent.name}</TableCell>
                                                <TableCell className="text-right">{agent.phone || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">Belum ada agen</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
