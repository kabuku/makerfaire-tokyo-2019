import paho.mqtt.client as mqtt


def main():
    client = mqtt.Client()
    client.connect("localhost", 1883, 60)
