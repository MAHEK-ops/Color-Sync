import React, { useState, useEffect } from "react";
import {View,Text,StyleSheet,Dimensions,TouchableOpacity,TouchableWithoutFeedback} from "react-native";

import { Accelerometer } from "expo-sensors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const PLAYER_SIZE = 60;
const STAR_SIZE = 35;

const COLORS = ["#ff4b4b", "#4bb3ff", "#4bff62"]; 

export default function App() {
  const [playerX, setPlayerX] = useState((screenWidth - PLAYER_SIZE) / 2);
  const [playerColorIndex, setPlayerColorIndex] = useState(0);

  const [stars, setStars] = useState([]);
  const [score, setScore] = useState(0);

  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);

  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("highScore");
      if (saved) setHighScore(Number(saved));
    })();
  }, []);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      AsyncStorage.setItem("highScore", String(score));
    }
  }, [score]);

  const restartGame = () => {
    setPlayerX((screenWidth - PLAYER_SIZE) / 2);
    setPlayerColorIndex(0);
    setStars([]);
    setScore(0);
    setLives(3);
    setGameOver(false);
  };

  useEffect(() => {
    Accelerometer.setUpdateInterval(100);
    const sub = Accelerometer.addListener(({ x }) => {
      const move = playerX - x * 25;
      const limited = Math.max(0, Math.min(move, screenWidth - PLAYER_SIZE));
      setPlayerX(limited);
    });
    return () => sub.remove();
  }, [playerX]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      const star = {
        id: Date.now(),
        x: Math.random() * (screenWidth - STAR_SIZE),
        y: screenHeight,
        color: COLORS[Math.floor(Math.random() * 3)],
      };
      setStars((prev) => [...prev, star]);
    }, 1500);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setStars((prev) =>
        prev
          .map((s) => ({ ...s, y: s.y - 3 }))
          .filter((s) => {
            if (s.y < 0) {
              setLives((l) => {
                if (l - 1 <= 0) setGameOver(true);
                return l - 1;
              });
              return false;
            }
            return true;
          })
      );
    }, 40);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    stars.forEach((s) => {
      const hitX = playerX < s.x + STAR_SIZE && playerX + PLAYER_SIZE > s.x;
      const hitY = s.y < PLAYER_SIZE + 20;

      if (hitX && hitY) {
        if (s.color === COLORS[playerColorIndex]) {
          setScore((p) => p + 1);
        } else {
          setLives((l) => {
            if (l - 1 <= 0) setGameOver(true);
            return l - 1;
          });
        }
        setStars((prev) => prev.filter((st) => st.id !== s.id));
      }
    });
  }, [stars]);

  const handleTap = () => {
    if (gameOver) return;
    setPlayerColorIndex((prev) => (prev + 1) % 3);
  };

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <LinearGradient
        colors={["#0f0c29", "#302b63", "#24243e"]}
        style={styles.container}
      >
        {stars.map((s) => (
          <View
            key={s.id}
            style={[
              styles.star,
              {
                left: s.x,
                bottom: s.y,
                backgroundColor: s.color,
              },
            ]}
          />
        ))}

        <View
          style={[
            styles.player,
            {
              left: playerX,
              backgroundColor: COLORS[playerColorIndex],
            },
          ]}
        />

        <Text style={styles.title}>Tilt to move — Tap to switch color</Text>

        <Text style={styles.score}>Score: {score}</Text>

        <Text style={styles.highScore}>🏆 High Score: {highScore}</Text>

        <Text style={styles.lives}>❤️ {lives}</Text>

        {gameOver && (
          <View style={styles.overlay}>
            <View style={styles.gameOverBox}>
              <Text style={styles.gameOverText}>GAME OVER</Text>
              <Text style={styles.finalScore}>Final Score: {score}</Text>
              <TouchableOpacity style={styles.restartButton} onPress={restartGame}>
                <Text style={styles.restartText}>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 60,
  },
  player: {
    position: "absolute",
    bottom: 10,
    width: PLAYER_SIZE,
    height: PLAYER_SIZE,
    borderRadius: 15,
    shadowColor: "#fff",
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  star: {
    position: "absolute",
    width: STAR_SIZE,
    height: STAR_SIZE,
    borderRadius: 10,
    shadowColor: "#fff",
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  title: {
    position: "absolute",
    top: 45,
    color: "#fff",
    fontSize: 19,
    left: 50
  },
  score: {
    position: "absolute",
    top: 70,
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowRadius: 10,
  },
  highScore: {
    position: "absolute",
    top: 108,
    color: "#ffd700",
    fontSize: 22,
    fontWeight: "bold",
    textShadowColor: "#000",
    textShadowRadius: 10,
  },
  lives: {
    position: "absolute",
    top: 140,
    color: "#ff4b4b",
    fontSize: 26,
    fontWeight: "bold",
  },
  overlay: {
    position: "absolute",
    width: screenWidth,
    height: screenHeight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  gameOverBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    padding: 30,
    borderRadius: 20,
    width: "70%",
    alignItems: "center",
    borderColor: "#fff",
    borderWidth: 1,
  },
  gameOverText: {
    fontSize: 32,
    color: "white",
    marginBottom: 10,
    fontWeight: "bold",
  },
  finalScore: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 20,
  },
  restartButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 15,
  },
  restartText: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
