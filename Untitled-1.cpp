#include <WiFi.hpp>       // Für ESP32 (Nutze <ESP8266WiFi.h> für ESP8266)
#include <HTTPClient.h>

// WLAN Zugangsdaten
const char* ssid = "StratoX";
const char* password = "Hellcat4090";

// Supabase Konfiguration
// Wir pingen meistens die REST-API einer Tabelle an
const char* supabaseUrl = "https://rixeqwlkgczmbvhtjndm.supabase.co";;
const char* supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpeGVxd2xrZ2N6bWJ2aHRqbmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1Njc4OTMsImV4cCI6MjA4NjE0Mzg5M30._4GIn38eww1UQpW9JP1gfDQJXB48Fhluwm--oiA4XaE";

// Intervall: 7.5 Minuten = 7.5 * 60 * 1000 ms
const unsigned long interval = 450000; 
unsigned long previousMillis = 0;

void setup() {
  Serial.begin(115200);

  // WLAN Verbindung aufbauen
  WiFi.begin(ssid, password);
  Serial.print("Verbinde mit WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nVerbunden!");
}

void loop() {
  unsigned long currentMillis = millis();

  // Prüfen, ob 7.5 Minuten vergangen sind (Überlaufsicher)
  if (currentMillis - previousMillis >= interval) {
    previousMillis = currentMillis;
    
    if (WiFi.status() == WL_CONNECTED) {
      pingSupabase();
    } else {
      Serial.println("WiFi verloren. Rekonstruiere Verbindung...");
      WiFi.reconnect();
    }
  }
}

void pingSupabase() {
  HTTPClient http;

  // URL und Header setzen
  http.begin(supabaseUrl);
  http.addHeader("apikey", supabaseAnonKey);
  http.addHeader("Authorization", String("Bearer ") + supabaseAnonKey);

  // GET Request senden
  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    Serial.print("Ping erfolgreich! Status: ");
    Serial.println(httpResponseCode);
  } else {
    Serial.print("Fehler beim Ping: ");
    Serial.println(httpResponseCode);
  }

  http.end();
}