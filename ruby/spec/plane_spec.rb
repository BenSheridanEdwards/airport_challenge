require 'plane'
require 'airport'
require 'weather_spec'

describe Plane do

  let(:plane) { Plane.new }
  let(:airport) { Airport.new }

  it "should initialize with the plane not being airborne" do
    expect(plane.airborne?).to eq(false)
  end

  it "shouldn't be airborne when in the hangar" do
    allow(airport).to receive(:stormy?).and_return(false)
    airport.hangar = [plane]
    expect(plane.airborne?).to be_falsey
  end

  it "should be airborne if it takes off successfully from the airport" do
    allow(airport).to receive(:stormy?).and_return(false)
    airport.land(plane)
    airport.take_off(plane)
    expect(plane.airborne?).to be_truthy
  end

  describe '#take_off' do

    it "should be airborne when take_off is called" do
      plane.take_off
      expect(plane.airborne?).to be_truthy
    end

  end

  describe '#landed' do

    it "should not be airborne when landed is called" do
      plane.landed
      expect(plane.airborne?).to be_falsey
    end

  end
end
