import {Suspense} from 'react';
import {catalogCards,categories} from '@/lib/catalog';
import {CatalogBrowser,CatalogView} from '@/components/catalog';
export const metadata={title:'La colección'};
export const revalidate=false;
export default async function Products(){const [cards,cats]=await Promise.all([catalogCards(),categories()]);return <Suspense fallback={<CatalogView cards={cards} cats={cats}/>}><CatalogBrowser cards={cards} cats={cats}/></Suspense>}
