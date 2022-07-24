import Phaser from 'phaser'
import Chest from '../items/Chest'

import { sceneEvents } from '../events/EventsCenter'

//what is this for???
/*declare global {
	namespace Phaser.GameObjects {
		interface GameObjectFactory {
			faune(x: number, y: number, texture: string, frame?: string | number): Faune
		}
	}
}*/

enum HealthState {
	IDLE,
	DAMAGE,
	DEAD
}

let space_pressed = false;
let char_anim_frame = 0;

export default class Faune extends Phaser.Physics.Arcade.Sprite {//Phaser.GameObjects.Container {//Phaser.Physics.Arcade.Sprite {
	private healthState = HealthState.IDLE
	private damageTime = 0

	private _health = 3
	private _coins = 0

	private knives?: Phaser.Physics.Arcade.Group
	private punch?: Phaser.Physics.Arcade.Image
	private activeChest?: Chest

	get health() {
		return this._health
	}

	constructor(scene: Phaser.Scene, x: number, y: number, texture: string, frame?: string | number) {
		//constructor(scene: Phaser.Scene, x?: number, y?: number, children?: Phaser.GameObjects.GameObject[]) {
		//this.player = this.add.container(200, 200, [this.add.sprite(0, 0, "mandy", 26), this.add.sprite(0, 0, "rapier").setVisible(false)]).setDepth(1).setScale(2);

		super(scene, x, y, texture, frame)

		this.anims.play('faune-idle-down')
	}

	setKnives(knives: Phaser.Physics.Arcade.Group) {
		this.knives = knives
	}

	setPunch(punch: Phaser.Physics.Arcade.Image) {
		this.punch = punch
	}

	setChest(chest: Chest) {
		this.activeChest = chest
	}

	handleDamage(dir: Phaser.Math.Vector2) {
		if (this._health <= 0) {
			return
		}

		if (this.healthState === HealthState.DAMAGE) {
			return
		}

		--this._health

		if (this._health <= 0) {
			// TODO: die
			this.healthState = HealthState.DEAD
			this.anims.play('faune-faint')
			this.setVelocity(0, 0)
		}
		else {
			this.setVelocity(dir.x, dir.y)

			this.setTint(0xff0000)

			this.healthState = HealthState.DAMAGE
			this.damageTime = 0
		}
	}

	private throwKnife() {
		if (!this.knives) {
			return
		}

		const knife = this.knives.get(this.x, this.y, 'knife') as Phaser.Physics.Arcade.Image
		if (!knife) {
			return
		}

		const parts = this.anims.currentAnim.key.split('-')
		const direction = parts[2]

		const vec = new Phaser.Math.Vector2(0, 0)

		switch (direction) {
			case 'up':
				vec.y = -1
				break

			case 'down':
				vec.y = 1
				break

			default:
			case 'side':
				if (this.scaleX < 0) {
					vec.x = -1
				}
				else {
					vec.x = 1
				}
				break
		}

		const angle = vec.angle()

		knife.setActive(true)
		knife.setVisible(true)

		knife.setRotation(angle)

		knife.x += vec.x * 16
		knife.y += vec.y * 16

		knife.setVelocity(vec.x * 300, vec.y * 300)

	}

	private throwPunch() {
		if (!this.punch) {
			return
		}

		const punch = this.punch
		if (!punch) {
			return
		}

		this.punch.enableBody(true, this.x, this.y, true, true)

		const parts = this.anims.currentAnim.key.split('-')
		const direction = parts[2]

		const vec = new Phaser.Math.Vector2(0, 0)

		//reset pos
		punch.x = this.x
		punch.y = this.y

		switch (direction) {
			case 'up':
				vec.y = -1
				break

			case 'down':
				vec.y = 1
				break

			default:
			case 'side':
				if (this.scaleX < 0) {
					vec.x = -1
				}
				else {
					vec.x = 1
				}
				break
		}

		const angle = vec.angle()

		punch.setActive(true)
		punch.setVisible(true)

		punch.setRotation(angle)

		punch.x += vec.x * 16
		punch.y += vec.y * 16

		punch.setVelocity(vec.x * 300, vec.y * 300)
	}

	preUpdate(t: number, dt: number) {
		super.preUpdate(t, dt)

		switch (this.healthState) {
			case HealthState.IDLE:
				break

			case HealthState.DAMAGE:
				this.damageTime += dt
				if (this.damageTime >= 250) {
					this.healthState = HealthState.IDLE
					this.setTint(0xffffff)
					this.damageTime = 0
				}
				break
		}
	}

	update(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
		if (space_pressed) {
			console.log(`update space pressed!`)

			if (char_anim_frame == 3) {
				char_anim_frame = 0;
				space_pressed = false;
			}
			else {
				this.anims.play('char1-jab', true)
				this.anims.play('char1_hurt-jab', true)
				char_anim_frame++
			}
		}

		if (this.healthState === HealthState.DAMAGE
			|| this.healthState === HealthState.DEAD
		) {
			return
		}

		if (!cursors) {
			return
		}

		if (Phaser.Input.Keyboard.JustDown(cursors.space!)) {
			if (this.activeChest) {
				const coins = this.activeChest.open()
				this._coins += coins

				sceneEvents.emit('player-coins-changed', this._coins)
			}
			else {
				//this.throwKnife()
				//this.anims.play('char1-jab', true)
				space_pressed = true;
				this.throwPunch()
			}
			return
		}

		const speed = 100

		const leftDown = cursors.left?.isDown
		const rightDown = cursors.right?.isDown
		const upDown = cursors.up?.isDown
		const downDown = cursors.down?.isDown

		if (leftDown) {
			//this.anims.play('faune-run-side', true)
			this.anims.play('char1-walk-right', true)
			this.anims.play('char1_hurt-walk-right', true)
			this.setVelocity(-speed, 0)

			this.scaleX = -1
			this.body.offset.x = 24
		}
		else if (rightDown) {
			//this.anims.play('faune-run-side', true)
			//this.anims.play('char1-walk-right', true)
			this.anims.play('char1_hurt-walk-right', true)
			this.setVelocity(speed, 0)

			this.scaleX = 1
			this.body.offset.x = 8
		}
		else if (upDown) {
			//this.anims.play('faune-run-up', true)
			this.anims.play('char1-guard', true)
			this.anims.play('char1_hurt-guard', true)
			this.setVelocity(0, -speed)
		}
		else if (downDown) {
			//this.anims.play('faune-run-down', true)
			this.anims.play('char1-guard', true)
			this.anims.play('char1_hurt-guard', true)

			this.setVelocity(0, speed)
		}
		else {
			const parts = this.anims.currentAnim.key.split('-')
			parts[1] = 'idle'
			//this.anims.play(parts.join('-'))
			//this.anims.play('char1-jab', true)
			this.setVelocity(0, 0)
		}

		if (leftDown || rightDown || upDown || downDown) {
			this.activeChest = undefined
		}

		if (this.punch) {
			const punch_dist = Phaser.Math.Distance.Between(this.x, this.y, this.punch.x, this.punch.y)
			//console.log(`Faune update this.punch distance = ${punch_dist}`)
			if (punch_dist > 20) {
				//this.punch.setActive(false)
				this.punch.disableBody(true, true)
			}
		}
	}
}

Phaser.GameObjects.GameObjectFactory.register('faune', function (this: Phaser.GameObjects.GameObjectFactory, x: number, y: number, texture: string, frame?: string | number) {
	var sprite = new Faune(this.scene, x, y, texture, frame)

	this.displayList.add(sprite)
	this.updateList.add(sprite)

	this.scene.physics.world.enableBody(sprite, Phaser.Physics.Arcade.DYNAMIC_BODY)

	sprite.body.setSize(sprite.width * 0.5, sprite.height * 0.8)

	return sprite
})
