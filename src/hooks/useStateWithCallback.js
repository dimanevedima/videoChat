import {useState, useRef, useCallback, useEffect} from 'react';

const useStateWithCallback = initialState => {
  const [state, setState] = useState(initialState); // не трогаем напрямую
  const cbRef = useRef(null); // сохраняем наш колбек

  const updateState = useCallback((newState, cb) => { // принмает новое состояние и колбек
    cbRef.current = cb; // колбек сохраняем в реф
    setState(prev => typeof newState === 'function' ? newState(prev) : newState); // вызываем SetState
  }, []);

// реагируем на изменение стейта и вызываем колбек
  useEffect(() => {
    if (cbRef.current){
      cbRef.current(state);
      cbRef.current = null;
    }
  }, [state]);

  return [state, updateState];
};

export default useStateWithCallback;

// Подробнее
// Экспортим отсюда updateState который принимает новое состояние и колбек
// Колбек соханяет в реф
// И вызывает этот сетстейт
// После этого стейт изменился
// Срабатывает useEffect
// вызывается колбек
