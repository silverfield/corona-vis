import { dataProvider, useWorldData, useCompareData } from '../contexts/DataProvider'
import World from './mains/World'
import Compare from './mains/Compare'

export default function Main({
    route
}) {
    const worldData = dataProvider();
    const compareData = dataProvider();

    return (
        <main>
            <div hidden={route !== 'world'}>
                <World data={worldData}/>
            </div>
            <div hidden={route !== 'compare'}>
                <Compare data={compareData}/>
            </div> 
        </main>
    );
  }
  