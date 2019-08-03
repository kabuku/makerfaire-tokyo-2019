#!/usr/bin/env python
from enum import Enum
import os
import pigpio
import signal
import paho.mqtt.client as mqtt
import logging
import threading
import setting
from concurrent.futures.thread import ThreadPoolExecutor

logger = logging.getLogger(__name__)
# GPIO.setmode(GPIO.BCM)
executor = ThreadPoolExecutor()

pi = pigpio.pi()


class Wheel(Enum):
    RIGHT = 1
    LEFT = 2


class Servo(object):

    def __init__(self, gpio_number):
        self.gpio_number = gpio_number
        pi.set_mode(gpio_number, pigpio.OUTPUT)
        # self.servo.start(0)
        self.exit = threading.Event()

    def run(self, dudy_cycle):
        try:
            dudy_cycle = float(dudy_cycle) * 10000
            logger.info(dudy_cycle)
            pi.hardware_PWM(self.gpio_number, 50, dudy_cycle)
        except Exception as e:
            logger.error(e)

    def __del__(self):
        pi.set_mode(self.gpio_number, pigpio.INPUT)


class MQTTClient(object):

    def __init__(self, robot_name, server_hosts):
        self.client = mqtt.Client(client_id="{}".format(robot_name))
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message
        # self.client.on_disconnect = self.on_disconnect
        self.robot_name = robot_name
        self.right_servo = Servo(gpio_number=12)
        self.left_servo = Servo(gpio_number=13)
        self.server_hosts = server_hosts

    def connect(self):
        self.client.will_set("{}/connection".format(self.robot_name), payload=0, qos=1, retain=True)
        import socket
        for count, host in enumerate(self.server_hosts):
            logger.info("try connection: {}".format(host))
            try:
                self.client.connect(host, 1883, 60)
            except socket.error:
                logger.warning("failed connection: {}".format(host))
                if len(self.server_hosts) - 1 > count:
                    continue
                else:
                    raise socket.error
            else:
                break

        # Blocking call that processes network traffic, dispatches callbacks and
        # handles reconnecting.
        # Other loop*() functions are available that give a threaded interface and a
        # manual interface.
        self.client.loop_forever()

    def on_connect(self, client, userdata, flags, rc):
        logger.info("Connected with result code " + str(rc))
        # self.led_connect.output(True)
        # Subscribing in on_connect() means that if we lose the connection and
        # reconnect then subscriptions will be renewed.
        servos_topic = "{}/servos".format(self.robot_name)
        client.subscribe(servos_topic, qos=0)
        client.publish("{}/connection".format(self.robot_name), payload=1, qos=1, retain=True)

    # The callback for when a PUBLISH message is received from the server.
    def on_message(self, client, userdata, msg):
        logger.info(msg.topic + " " + str(msg.payload))
        if msg.topic == "{}/servos".format(self.robot_name):
            left, right = msg.payload.split(",")
            executor.submit(self.left_servo.run, left)
            executor.submit(self.right_servo.run, right)

    def signal_handler(self, number, frame):
        self.__del__()

    def __del__(self):
        self.client.publish("{}/connection".format(self.robot_name), payload=0, qos=1, retain=True)
        self.client.disconnect()
        self.right_servo.exit.set()
        self.left_servo.exit.set()
        self.left_servo.__del__()
        self.right_servo.__del__()
        pi.stop()
        # GPIO.cleanup()
        logger.info("exit")


def main():
    robot_name = os.uname()[1].split("-")[1]
    logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
    logger.info("robotname: {}, servers: {}".format(robot_name, setting.servers))
    m_client = MQTTClient(robot_name, setting.servers)
    signal.signal(signal.SIGINT, m_client.signal_handler)
    signal.signal(signal.SIGTERM, m_client.signal_handler)

    m_client.connect()


main()
