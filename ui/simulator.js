import mqtt from 'mqtt';

const BROKER = 'wss://d0e0ce8ffc364fe4b5c641f8f84ef0a1.s1.eu.hivemq.cloud:8884/mqtt';
const client = mqtt.connect(BROKER, {
    username: 'thesis_pi',
    password: process.env.MQTT_PASSWORD || 'your-mqtt-password',
});

client.on('connect', () => {
    console.log('✅ Connected to HiveMQ Cloud - Simulating Hardware...');

    setInterval(() => {
        const sensorData = {
            temp: 25 + Math.random() * 5,
            hum: 60 + Math.random() * 10,
            soil_1: 40 + Math.random() * 20,
            soil_2: 40 + Math.random() * 20,
            soil_3: 40 + Math.random() * 20,
            soil_4: 40 + Math.random() * 20,
            soil_5: 40 + Math.random() * 20,
            soil_6: 40 + Math.random() * 20,
            water_level_healthy: 80 + Math.random() * 10,
            water_level_diseased: 10 + Math.random() * 5,
            timestamp: new Date().toISOString()
        };

        client.publish('rice/sensors', JSON.stringify(sensorData));
        console.log('📤 Published sensor update');
    }, 5000); // Send data every 5 seconds
});
