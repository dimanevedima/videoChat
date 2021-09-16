import {BrowserRouter, Switch, Route} from 'react-router-dom';
import {Main, NotFound404, Room} from './pages';
// Настроим роутинг


const App = () => {
  return (
  <BrowserRouter>
    <Switch>
      <Route exact path = '/room/:id' component = {Room}/>
      <Route exact path = '/' component = {Main}/>
      <Route component = {NotFound404}/>
    </Switch>
  </BrowserRouter>
  );
}

export default App;
