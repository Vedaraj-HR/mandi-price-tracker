import CheapestRoute from '@/components/CheapestRoute';

export default function RoutesPage() {
    return (
        <>
            <h1>Route finder between mandis</h1>
            <p className='hint'>
                The cheapest route is computed twice, in Neo4j and with a recursive
                SQL query. Roads closed by a mandi are not used.
            </p>
            <CheapestRoute />
        </>
    );
}