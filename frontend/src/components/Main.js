import { DataProvider, useWorldData, useCompareData } from '../contexts/DataProvider'
import World from './mains/World'
import Compare from './mains/Compare'

function Content({
    route
}) {  
    const worldData = useWorldData();
    const compareData = useCompareData();

    return <>
        <div hidden={route !== 'world'}>
            <World data={worldData}/>
        </div>
        <div hidden={route !== 'compare'}>
            <Compare data={compareData}/>
        </div> 
    </>
}

export default function Main({
    route
}) {
    return (
        <main>
            <DataProvider>
                <Content route={route}/>
            </DataProvider>
        </main>
    );
  }
  