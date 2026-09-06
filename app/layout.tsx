import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {title:'Eagley Valley | Drive to the mills',description:'Explore Eagley, Bolton. Drive from Eagley Way through Threadfold Way, park beside Bridge Mill and continue on foot.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
