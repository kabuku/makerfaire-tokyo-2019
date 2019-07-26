import paho.mqtt.client as mqtt


def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))


robot_name = "nobunaga"
client = mqtt.Client()
client.connect("localhost")
client.subscribe("{}/servos".format(robot_name))
client.subscribe("{}/command".format(robot_name))
client.on_message = on_message
client.loop_forever()
# テスト用
