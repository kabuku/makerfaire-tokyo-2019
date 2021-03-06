import time
import pprint
from datetime import datetime
import argparse
import pygame
import paho.mqtt.client as mqtt

DUTY_CYCLE_MAX = 12
DUTY_CYCLE_MIN = 2.5
LEFT_WEIGHTING_VALUE = 1
RIGHT_WEIGHTING_VALUE = 1
AXIS_THRESHOLD = 0.05


def get_max_duty_cycle_left():
    return DUTY_CYCLE_MAX - 4


def get_max_duty_cycle_right():
    return DUTY_CYCLE_MAX - 0


def get_min_duty_cycle_left():
    return DUTY_CYCLE_MIN + 0


def get_min_duty_cycle_right():
    return DUTY_CYCLE_MIN + 0


class Servo(object):
    def __init__(self, duty_cycle_max, duty_cycle_min, gain=0):
        self.duty_cycle_max = duty_cycle_max - gain
        self.duty_cycle_min = duty_cycle_min + gain

    def __repr__(self):
        return "{} {}".format(self.duty_cycle_max, self.duty_cycle_min)


class MQTTClient(mqtt.Client):

    def __init__(self, robot_name, client_id="", clean_session=True, userdata=None,
                 protocol=mqtt.MQTTv311, transport="tcp"):
        super(MQTTClient, self).__init__(client_id, clean_session, userdata, protocol, transport)
        self.robot_name = robot_name

    def publish_servo(self, left, right, previous_payload=None):
        payload = "{},{}".format(left, right)
        if payload == previous_payload:
            return payload
        print(payload)

        self.publish("{}/servos".format(self.robot_name), payload, qos=0)
        return payload

    def publish_command(self, command):
        self.publish("{}/status".format(self.robot_name), command, qos=0)
        print(command)

    def publish_controller_button(self, button):
        from datetime import datetime
        self.publish("{}/controller/button".format(self.robot_name), "{},{}".format(datetime.now().isoformat(), button), qos=0)
        print(button)


class JCU3712FBKController(object):

    def __init__(self, joystick_id, left_max, left_min, right_max, right_min, client: MQTTClient, left_rotate=7, right_rotate=7.6):

        pygame.init()
        pygame.joystick.init()
        self.controller = pygame.joystick.Joystick(joystick_id)
        self.controller.init()
        self.axis_data = {}
        gain = 4
        self.left_servo = Servo(duty_cycle_max=left_max, duty_cycle_min=left_min, gain=gain)
        self.right_servo = Servo(duty_cycle_max=right_max, duty_cycle_min=right_min, gain=gain)
        self.client = client
        self.adjustment = 0.1
        self.left_rotate = left_rotate
        self.right_rotate = right_rotate
        print("left: {}, right: {}".format(self.left_servo, self.right_servo))

    def listen(self):

        try:
            previous_payload = None
            while True:

                for event in pygame.event.get():
                    if event.type == pygame.JOYBUTTONDOWN:
                        # print(event.button)
                        self.client.publish_controller_button(event.button)
                        if event.button == 3:
                            self.client.publish_command("{},shot".format(datetime.now().isoformat()))

                        if event.button == 4:
                            self.left_servo.duty_cycle_min -= self.adjustment
                            self.left_servo.duty_cycle_max += self.adjustment
                            print("left {}".format(self.left_servo))
                        elif event.button == 6:
                            self.left_servo.duty_cycle_min += self.adjustment
                            self.left_servo.duty_cycle_max -= self.adjustment
                            print("left {}".format(self.left_servo))

                        elif event.button == 5:
                            self.right_servo.duty_cycle_min -= self.adjustment
                            self.right_servo.duty_cycle_max += self.adjustment
                            print("right {}", self.right_servo)
                        elif event.button == 7:
                            self.right_servo.duty_cycle_min += self.adjustment
                            self.right_servo.duty_cycle_max -= self.adjustment
                            print("right {}", self.right_servo)
                    if event.type == pygame.JOYAXISMOTION:
                        self.axis_data[event.axis] = round(event.value)

                    if self.axis_data.get(1) == 1:
                        # 後退
                        previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_max, right=self.right_servo.duty_cycle_min, previous_payload=previous_payload)
                    elif self.axis_data.get(1) == -1:
                        # 前進
                        previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_min, right=self.right_servo.duty_cycle_max, previous_payload=previous_payload)
                    elif self.axis_data.get(0) == 0 and self.axis_data.get(1) == 0:
                        previous_payload = self.client.publish_servo(left=0, right=0, previous_payload=previous_payload)
                        # previous_payload = self.client.publish_servo(left=0, right=0, previous_payload=previous_payload)
                    elif self.axis_data.get(0) == 1:
                        # 右旋回

                        previous_payload = self.client.publish_servo(left=self.right_rotate, right=self.right_rotate, previous_payload=previous_payload)
                    elif self.axis_data.get(0) == -1:
                        # 左旋回
                        previous_payload = self.client.publish_servo(left=self.left_rotate, right=self.left_rotate, previous_payload=previous_payload)

                    else:
                        previous_payload = self.client.publish_servo(left=0.1, right=0.1, previous_payload=previous_payload)

        except KeyboardInterrupt:
            pass

        self.client.publish_servo(left=0, right=0)
        print("{}, left {}, right {} {}".format(self.client.robot_name, self.left_servo, self.right_servo, self.client.robot_name))
        self.client.disconnect()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("-i", "--id", type=int)
    parser.add_argument("-n", "--robot_name", type=str)
    parser.add_argument("-b", "--broker", default="localhost", type=str)
    parser.add_argument("-p", "--port", default=1883, type=int)
    parser.add_argument("--left_max", default=12, type=float)
    parser.add_argument("--left_min", default=2.5, type=float)
    parser.add_argument("--right_max", default=12, type=float)
    parser.add_argument("--right_min", default=2.5, type=float)
    parser.add_argument("--left_rotate", default=7.2, type=float)
    parser.add_argument("--right_rotate", default=7.6, type=float)
    args = parser.parse_args()
    client = MQTTClient(args.robot_name)
    client.connect(args.broker, args.port, 3600)
    ps4 = JCU3712FBKController(joystick_id=args.id, left_max=args.left_max, left_min=args.left_min, right_max=args.right_max, right_min=args.right_min, client=client, right_rotate=args.right_rotate,
                               left_rotate=args.left_rotate)
    ps4.listen()


if __name__ == "__main__":
    main()
