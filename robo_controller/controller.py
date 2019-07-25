import time
import pprint
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


# def get_duty_cycle_right(duty_cycle):
#     return duty_cycle * RIGHT_WEIGHTING_VALUE


class Servo(object):
    def __init__(self, duty_cycle_max, duty_cycle_min):
        self.duty_cycle_max = duty_cycle_max
        self.duty_cycle_min = duty_cycle_min


class MQTTClient(mqtt.Client):

    def __init__(self, robot_name, client_id="", clean_session=True, userdata=None,
                 protocol=mqtt.MQTTv311, transport="tcp"):
        super(MQTTClient, self).__init__(client_id, clean_session, userdata, protocol, transport)
        self.robot_name = robot_name

    def publish_servo(self, left, right, previous_payload=None):
        payload = "{},{}".format(left, right)
        if payload == previous_payload:
            return payload

        self.publish("{}/servos".format(self.robot_name), payload)
        print(payload)
        return payload


class JCU3712FBKController(object):

    def __init__(self, left_max, left_min, right_max, right_min, client: MQTTClient):

        pygame.init()
        pygame.joystick.init()
        self.controller = pygame.joystick.Joystick(0)
        self.controller.init()
        self.axis_data = {}
        self.robot_name = "nobunaga"
        self.left_servo = Servo(duty_cycle_max=left_max, duty_cycle_min=left_min)
        self.right_servo = Servo(duty_cycle_max=right_max, duty_cycle_min=right_min)
        self.client = client

    def listen(self):

        try:
            previous_payload = None
            while True:
                # e = pygame.event.get()
                # pprint.pprint(e)
                # pprint.pprint(pygame.event.get())
                for event in pygame.event.get():
                    # pprint.pprint(event)
                    # if event.type == pygame.BUTTON_WHEELUP:
                    #     self.axis_data[event.axis] = event.value

                    if event.type == pygame.JOYAXISMOTION:
                        print("{} {}".format(event.axis, event.value))
                        if event.axis == 1:
                            if event.value >= 1:
                                previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_max, right=self.right_servo.duty_cycle_min, previous_payload=previous_payload)
                            else:
                                previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_min, right=self.right_servo.duty_cycle_max, previous_payload=previous_payload)
                        elif event.axis == 0:
                            if event.value >= 1:
                                previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_max, right=self.right_servo.duty_cycle_max, previous_payload=previous_payload)
                            else:
                                previous_payload = self.client.publish_servo(left=self.left_servo.duty_cycle_min, right=self.right_servo.duty_cycle_min, previous_payload=previous_payload)

                self.client.loop()
                # time.sleep(0.05)

        except KeyboardInterrupt:
            pass

        self.client.publish_servo(left=0, right=0)
        self.client.disconnect()


def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))


def main():
    client = MQTTClient("nobunaga")
    client.connect("localhost", 1883, 60)
    ps4 = JCU3712FBKController(left_max=12.5, left_min=2.5, right_max=12.5, right_min=2.5, client=client)
    ps4.listen()


if __name__ == "__main__":
    main()
