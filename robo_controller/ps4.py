import time
import pygame
import paho.mqtt.client as mqtt

DUTY_CYCLE_MAX = 12
DUTY_CYCLE_MIN = 2.5
LEFT_WEIGHTING_VALUE = 0
RIGHT_WEIGHTING_VALUE = 0
AXIS_THRESHOLD = 0.05


def get_duty_cycle_left(duty_cycle):
    return duty_cycle * LEFT_WEIGHTING_VALUE


def get_duty_cycle_right(duty_cycle):
    return duty_cycle * RIGHT_WEIGHTING_VALUE


class PS4Controller(object):

    def __init__(self):

        pygame.init()
        pygame.joystick.init()
        self.controller = pygame.joystick.Joystick(0)
        self.controller.init()
        self.axis_data = {}

    def listen(self, client):

        try:
            previous_left_servo = None
            previous_right_servo = None
            while True:
                for event in pygame.event.get():
                    if event.type == pygame.JOYAXISMOTION:
                        self.axis_data[event.axis] = round(event.value, 2)

                if self.axis_data:
                    x = float(self.axis_data[1] - 0.06)
                    y = float(self.axis_data[1] - 0.06)

                    left_servo = 0
                    right_servo = 0

                    if x >= AXIS_THRESHOLD:
                        left_servo = get_duty_cycle_left(DUTY_CYCLE_MAX)
                        right_servo = get_duty_cycle_right(DUTY_CYCLE_MIN)
                    elif x <= -AXIS_THRESHOLD:
                        left_servo = get_duty_cycle_left(DUTY_CYCLE_MIN)
                        right_servo = get_duty_cycle_right(DUTY_CYCLE_MAX)

                    elif y >= AXIS_THRESHOLD:
                        left_servo = get_duty_cycle_left(DUTY_CYCLE_MAX)
                        right_servo = get_duty_cycle_right(DUTY_CYCLE_MAX)
                    elif y <= -AXIS_THRESHOLD:
                        left_servo = get_duty_cycle_left(DUTY_CYCLE_MIN)
                        right_servo = get_duty_cycle_right(DUTY_CYCLE_MIN)

                    if left_servo != previous_left_servo or right_servo != previous_right_servo:
                        client.publish("nobunaga/servos", "{},{}".format(left_servo, right_servo))
                        previous_left_servo = left_servo
                        previous_right_servo = right_servo

                client.loop()
                time.sleep(0.03)

        except KeyboardInterrupt:
            pass

        client.publish("nobunaga/right", "0")
        client.publish("nobunaga/left", "0")
        client.disconnect()


def on_message(client, userdata, msg):
    print(msg.topic + " " + str(msg.payload))


def main():
    client = mqtt.Client()
    client.connect("localhost", 1883, 60)
    client.loop()
    ps4 = PS4Controller()
    ps4.listen(client)


if __name__ == "__main__":
    main()
