import './style.css'
import { GameManager } from './core/GameManager';

const game = new GameManager();
// @ts-ignore
window.game = game;
